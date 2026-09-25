import { prisma } from './prisma';

type ActivityType = 'added_book' | 'reviewed_book' | 'completed_challenge';

interface ActivityInput {
  userId: string;
  type: ActivityType;
  bookId?: string | null;
  bookTitle?: string | null;
  bookCover?: string | null;
  content?: string | null;
}

/**
 * Writes a row to the Activity table, which powers the friends feed.
 * Activity is a secondary feature, so a failure here must never break the
 * action that triggered it (adding a book, etc.) — hence the swallowed error.
 */
export async function recordActivity(input: ActivityInput): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        userId: input.userId,
        type: input.type,
        bookId: input.bookId ?? null,
        bookTitle: input.bookTitle ?? null,
        bookCover: input.bookCover ?? null,
        content: input.content ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to record activity:', error);
  }
}
