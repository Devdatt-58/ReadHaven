import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import BookDetailClient from './BookDetailClient';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ensureDefaultShelves } from '@/lib/shelves';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic';

async function getBookData(id: string) {
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

  const response = await fetch(`${baseUrl}/api/books/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    notFound();
  }

  return response.json();
}

async function getUserBookData(userId: string | undefined, bookId: string) {
  if (!userId) return null;

  await ensureDefaultShelves(userId);

  const [shelves, review] = await Promise.all([
    prisma.shelf.findMany({
      where: { userId },
    }),
    prisma.review.findFirst({
      where: { userId, bookId },
    }),
  ]);

  return { shelves, review };
}

async function getBookReviews(bookId: string) {
  return prisma.review.findMany({
    where: { bookId },
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
      createdAt: 'desc',
    },
    take: 20,
  });
}

export default async function BookDetailPage({ params }: PageProps) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  const [book, userData, bookReviews] = await Promise.all([
    getBookData(id),
    getUserBookData(session?.user?.id, id),
    getBookReviews(id),
  ]);

  return (
    <BookDetailClient
      book={book}
      session={session}
      userShelves={userData?.shelves ?? []}
      userReview={userData?.review ?? null}
      bookReviews={bookReviews}
    />
  );
}
