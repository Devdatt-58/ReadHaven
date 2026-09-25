import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import StatisticsPageClient from './StatisticsPageClient';

async function getReadingStatistics(userId: string) {
  const [shelves, reviews, goals] = await Promise.all([
    prisma.shelf.findMany({
      where: { userId },
      include: {
        books: true,
      },
    }),
    prisma.review.findMany({
      where: { userId },
    }),
    prisma.readingGoal.findMany({
      where: { userId },
      orderBy: { year: 'desc' },
    }),
  ]);

  const readShelf = shelves.find(s => s.name === 'Read');
  const currentYear = new Date().getFullYear();

  // Books by year
  const booksByYear: { [year: number]: number } = {};
  readShelf?.books.forEach(book => {
    const year = new Date(book.addedAt).getFullYear();
    booksByYear[year] = (booksByYear[year] || 0) + 1;
  });

  // Books by month (current year)
  const booksByMonth = Array(12).fill(0);
  readShelf?.books.forEach(book => {
    const date = new Date(book.addedAt);
    if (date.getFullYear() === currentYear) {
      booksByMonth[date.getMonth()]++;
    }
  });

  // Average rating
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  // Rating distribution
  const ratingDistribution = [0, 0, 0, 0, 0];
  reviews.forEach(r => {
    ratingDistribution[r.rating - 1]++;
  });

  return {
    totalBooks: readShelf?.books.length || 0,
    totalReviews: reviews.length,
    averageRating,
    ratingDistribution,
    booksByYear,
    booksByMonth,
    goals,
    booksThisYear: booksByMonth.reduce((a, b) => a + b, 0),
  };
}

export default async function StatisticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const stats = await getReadingStatistics(session.user.id);

  return <StatisticsPageClient stats={stats} />;
}
