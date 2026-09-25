'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Post {
  id: string;
  content: string;
  bookTitle: string | null;
  bookCover: string | null;
  imageUrl: string | null;
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

export default function FeedSidebar({ posts, currentUserId }: Props) {
  const router = useRouter();
  const [localPosts, setLocalPosts] = useState(posts);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  const lastSyncedPostsRef = useRef(posts);
  const loginWithNoticeHref = '/login?notice=login-required';
  const createPostHref = currentUserId ? '/create-post' : loginWithNoticeHref;

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
    <div className="feed-sidebar">
      <div className="feed-header">
        <h4>Community</h4>
      
        <Link href="/feed" className="see-more-link">
          See all
        </Link>
      </div>

      <div className="feed-posts">
        {localPosts.length === 0 ? (
          <div className="empty-feed">
            <p>No posts yet. Be the first to share!</p>
            <Link href={createPostHref} className="create-post-btn-small">
              Create Post
            </Link>
          </div>
        ) : (
          localPosts.slice(0, 3).map((post) => (
            <div key={post.id} className="feed-post-card">
              <div className="post-header">
                <div className="post-user-info">
                  <div className="post-avatar">
                    {post.user.image ? (
                      <img src={post.user.image} alt={post.user.name || 'User'} />
                    ) : (
                      <div className="post-avatar-placeholder">
                        {post.user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="post-username">{post.user.name}</div>
                    <div className="post-time">{getTimeAgo(post.createdAt)}</div>
                  </div>
                </div>
              </div>

              <div className="post-content">
                <p>{post.content}</p>
                {post.bookCover && (
                  <div className="post-book">
                    <img src={post.bookCover} alt={post.bookTitle || 'Book'} />
                    {post.bookTitle && (
                      <span className="post-book-title">{post.bookTitle}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="post-actions">
                <button
                  onClick={() => handleLike(post.id)}
                  disabled={likingPosts.has(post.id)}
                  className={`action-btn ${isLiked(post) ? 'liked' : ''}`}
                >
                  <i className={`${isLiked(post) ? 'fas' : 'far'} fa-heart`}></i>
                  <span>{post.likes.length}</span>
                </button>
                <Link href={`/feed/${post.id}`} className="action-btn">
                  <i className="far fa-comment"></i>
                  <span>{post.comments.length}</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <Link href={createPostHref} className="create-post-btn">
        <i className="fas fa-plus"></i>
        Create Post
      </Link>
    </div>
  );
}
