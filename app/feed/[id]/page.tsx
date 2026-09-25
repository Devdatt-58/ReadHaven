import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PostDetailClient from './PostDetailClient';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getPostWithComments(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      likes: {
        select: {
          id: true,
          userId: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!post) return null;

  return {
    id: post.id,
    content: post.content,
    bookTitle: post.bookTitle,
    bookCover: post.bookCover,
    bookAuthors: post.bookAuthors,
    createdAt: post.createdAt.toISOString(),
    user: post.user,
    likes: post.likes,
    likesCount: post.likes.length,
    comments: post.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      user: comment.user,
    })),
  };
}

export default async function FeedPostPage({ params }: PageProps) {
  const { id } = await params;
  const [session, post] = await Promise.all([
    getServerSession(authOptions),
    getPostWithComments(id),
  ]);

  if (!post) {
    notFound();
  }

  const likedByCurrentUser = session?.user?.id
    ? post.likes.some((like) => like.userId === session.user.id)
    : false;

  return (
    <PostDetailClient
      post={post}
      currentUserId={session?.user?.id}
      likedByCurrentUser={likedByCurrentUser}
    />
  );
}
