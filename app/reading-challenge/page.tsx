import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ReadingChallengeClient from './ReadingChallengeClient';

async function getChallengeData(userId: string) {
  const currentYear = new Date().getFullYear();
  
  const [currentGoal, allGoals, shelves] = await Promise.all([
    prisma.readingGoal.findFirst({
      where: {
        userId,
        year: currentYear,
      },
    }),
    prisma.readingGoal.findMany({
      where: { userId },
      orderBy: { year: 'desc' },
    }),
    prisma.shelf.findMany({
      where: { userId },
      include: {
        books: {
          select: {
            addedAt: true,
          },
        },
      },
    }),
  ]);

  // Calculate books read this year
  const readShelf = shelves.find(s => s.name === 'Read');
  const booksReadThisYear = readShelf?.books.filter(
    book => new Date(book.addedAt).getFullYear() === currentYear
  ).length || 0;

  return {
    currentGoal,
    allGoals,
    booksReadThisYear,
    currentYear,
  };
}

export default async function ReadingChallengePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const challengeData = await getChallengeData(session.user.id);

  return <ReadingChallengeClient data={challengeData} user={session.user} />;
}
