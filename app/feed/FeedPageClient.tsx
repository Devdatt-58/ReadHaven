'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MobileTopBar from '../components/MobileTopBar';
import { getAccountNavItems, primaryMobileNavItems } from '../components/mobile-nav';

interface Post {
  id: string;
  content: string;
  bookTitle: string | null;
  bookCover: string | null;
  bookAuthors: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  likes: { id: string; userId: string }[];
  comments: { id: string }[];
}

interface Props {
  posts: Post[];
  currentUserId?: string;
}

export default function FeedPageClient({ posts, currentUserId }: Props) {
  const router = useRouter();
  const [localPosts, setLocalPosts] = useState(posts);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  const lastSyncedPostsRef = useRef(posts);
  const loginWithNoticeHref = '/login?notice=login-required';
  const createPostHref = currentUserId ? '/create-post' : loginWithNoticeHref;
  const accountItems = getAccountNavItems(Boolean(currentUserId));

  useEffect(() => {
    const postsChanged = posts !== lastSyncedPostsRef.current;
    if (!postsChanged || likingPosts.size > 0) {
      return;
    }

    setLocalPosts(posts);
    lastSyncedPostsRef.current = posts;
  }, [posts, likingPosts]);

  const setPostLikeState = (liked: boolean, postId: string, userId: string) => {
    setLocalPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;

        const likesWithoutCurrentUser = post.likes.filter((like) => like.userId !== userId);
        if (!liked) {
          return { ...post, likes: likesWithoutCurrentUser };
        }

        return {
          ...post,
          likes: [...likesWithoutCurrentUser, { id: `optimistic-${userId}-${postId}`, userId }],
        };
      })
    );
  };

  const handleLike = async (postId: string) => {
    if (!currentUserId) {
      router.push(loginWithNoticeHref);
      return;
    }

    if (likingPosts.has(postId)) return;

    const post = localPosts.find((item) => item.id === postId);
    const wasLiked = post ? post.likes.some((like) => like.userId === currentUserId) : false;

    setPostLikeState(!wasLiked, postId, currentUserId);
    setLikingPosts((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });

    try {
      const response = await fetch('/api/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const data: { liked: boolean } = await response.json();
      setPostLikeState(data.liked, postId, currentUserId);
    } catch (error) {
      console.error('Like error:', error);
      setPostLikeState(wasLiked, postId, currentUserId);
    } finally {
      setLikingPosts((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const isLiked = (post: Post) => {
    return post.likes.some(like => like.userId === currentUserId);
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="feed-page">
      <MobileTopBar
        title="Book Feed"
        backHref="/"
        primaryAction={{ href: createPostHref, label: 'Post', icon: 'fas fa-plus' }}
        showProfileTrigger={Boolean(currentUserId)}
        navItems={primaryMobileNavItems}
        profileItems={accountItems}
      />
      <div className="feed-page-header mobile-page-heading">
        <Link href="/" className="back-home">
          ← Back to Home
        </Link>
        <h1>Book Feed</h1>
        <Link href={createPostHref} className="create-post-header-btn">
          <i className="fas fa-plus"></i>
          Create Post
        </Link>
      </div>

      <div className="feed-page-container">
        {localPosts.length === 0 ? (
          <div className="empty-feed-page">
            <i className="fas fa-book-open"></i>
            <h3>No posts yet</h3>
            <p>Be the first to share your thoughts about a book!</p>
            <Link href={createPostHref} className="create-first-post-btn">
              Create First Post
            </Link>
          </div>
        ) : (
          <div className="feed-posts-list">
            {localPosts.map((post) => (
              <div key={post.id} className="feed-post-full">
                <div className="post-header-full">
                  <div className="post-user-info-full">
                    <div className="post-avatar-full">
                      {post.user.image ? (
                        <img src={post.user.image} alt={post.user.name || 'User'} />
                      ) : (
                        <div className="post-avatar-placeholder-full">
                          {post.user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="post-username-full">{post.user.name}</div>
                      <div className="post-time-full">{getTimeAgo(post.createdAt)}</div>
                    </div>
                  </div>
                </div>

                <div className="post-content-full">
                  <p>{post.content}</p>
                  {post.bookCover && (
                    <div className="post-book-full">
                      <img src={post.bookCover} alt={post.bookTitle || 'Book'} />
                      <div className="post-book-details">
                        <h4>{post.bookTitle}</h4>
                        {post.bookAuthors && <p>by {post.bookAuthors}</p>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="post-actions-full">
                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={likingPosts.has(post.id)}
                    className={`action-btn-full ${isLiked(post) ? 'liked' : ''}`}
                  >
                    <i className={`${isLiked(post) ? 'fas' : 'far'} fa-heart`}></i>
                    <span>{post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}</span>
                  </button>
                  <Link href={`/feed/${post.id}`} className="action-btn-full">
                    <i className="far fa-comment"></i>
                    <span>{post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
