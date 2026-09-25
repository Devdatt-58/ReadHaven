import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureDefaultShelves } from '@/lib/shelves';
import { recordActivity } from '@/lib/activity';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { shelfId, bookId, bookData } = body as {
      shelfId?: unknown;
      bookId?: unknown;
      bookData?: {
        title?: unknown;
        authors?: unknown;
        thumbnail?: unknown;
      };
    };

    if (typeof shelfId !== 'string' || typeof bookId !== 'string' || !shelfId || !bookId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const title = typeof bookData?.title === 'string' ? bookData.title.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'Book title is required' }, { status: 400 });
    }

    const authors = Array.isArray(bookData?.authors)
      ? bookData.authors.filter((a): a is string => typeof a === 'string')
      : [];
    const thumbnail =
      typeof bookData?.thumbnail === 'string' && bookData.thumbnail
        ? bookData.thumbnail
        : null;

    await ensureDefaultShelves(session.user.id);

    const shelf = await prisma.shelf.findFirst({
      where: { id: shelfId, userId: session.user.id },
      select: { id: true },
    });

    if (!shelf) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 });
    }

    const existing = await prisma.shelfBook.findUnique({
      where: { shelfId_bookId: { shelfId, bookId } },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Book already on this shelf' },
        { status: 409 }
      );
    }

    const shelfBook = await prisma.shelfBook.create({
      data: { shelfId, bookId, title, authors, thumbnail },
    });

    await recordActivity({
      userId: session.user.id,
      type: 'added_book',
      bookId,
      bookTitle: title,
      bookCover: thumbnail,
    });

    return NextResponse.json({ data: shelfBook }, { status: 201 });
  } catch (error) {
    console.error('Add to shelf error:', error);
    return NextResponse.json(
      { error: 'Failed to add book to shelf' },
      { status: 500 }
    );
  }
}
