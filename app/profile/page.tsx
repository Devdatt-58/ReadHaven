import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ProfilePageClient from './ProfilePageClient';
import { ensureDefaultShelves } from '@/lib/shelves';

async function getUserProfileData(userId: string) {
  await ensureDefaultShelves(userId);

  const [user, shelves, reviews, readingGoals, friendsCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        website: true,
        createdAt: true,
      },
    }),
    prisma.shelf.findMany({
      where: { userId },
      include: {
        books: true,
      },
    }),
    prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.readingGoal.findMany({
      where: { userId },
      orderBy: { year: 'desc' },
    }),
    prisma.friendship.count({
      where: {
        status: 'accepted',
        OR: [{ userId }, { friendId: userId }],
      },
    }),
  ]);

  const totalBooks = shelves.reduce((sum, shelf) => sum + shelf.books.length, 0);
  const currentYearGoal =
    readingGoals.find(g => g.year === new Date().getFullYear()) ?? null;

  return {
    user,
    totalBooks,
    totalReviews: reviews.length,
    friendsCount,
    shelves,
    recentReviews: reviews,
    currentYearGoal,
    memberSince: user?.createdAt,
  };
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const profileData = await getUserProfileData(session.user.id);

  return <ProfilePageClient data={profileData} session={session} />;
}
