import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ReviewsPageClient from './ReviewsPageClient';

async function getUserReviews(userId: string) {
  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return reviews;
}

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const reviews = await getUserReviews(session.user.id);

  return <ReviewsPageClient reviews={reviews} />;
}
