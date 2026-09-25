import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import FeedPageClient from './FeedPageClient';

async function getFeedPosts() {
  const posts = await prisma.post.findMany({
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
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  return posts;
}

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  const posts = await getFeedPosts();

  return <FeedPageClient posts={posts} currentUserId={session?.user?.id} />;
}
