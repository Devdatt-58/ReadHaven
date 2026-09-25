import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePagination } from '@/lib/validation';

const MAX_REVIEW_LENGTH = 4000;

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

    const { bookId, rating, content } = body as {
      bookId?: unknown;
      rating?: unknown;
      content?: unknown;
    };

    if (typeof bookId !== 'string' || !bookId.trim()) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    let reviewContent: string | null = null;
    if (typeof content === 'string') {
      const trimmed = content.trim();
      if (trimmed.length > MAX_REVIEW_LENGTH) {
        return NextResponse.json(
          { error: `Review must be ${MAX_REVIEW_LENGTH} characters or fewer` },
          { status: 400 }
        );
      }
      reviewContent = trimmed || null;
    }

    const trimmedBookId = bookId.trim();
    const existing = await prisma.review.findFirst({
      where: { userId: session.user.id, bookId: trimmedBookId },
      select: { id: true },
    });

    const review = existing
      ? await prisma.review.update({
          where: { id: existing.id },
          data: { rating, content: reviewContent },
        })
      : await prisma.review.create({
          data: {
            userId: session.user.id,
            bookId: trimmedBookId,
            rating,
            content: reviewContent,
          },
        });

    return NextResponse.json(review, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId')?.trim();
    const { page, pageSize, skip, take } = parsePagination(searchParams, {
      defaultPageSize: 20,
      maxPageSize: 50,
    });

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    const where = { bookId };
    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      hasMore: skip + items.length < total,
    });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const reviewId =
      body && typeof body === 'object' && typeof (body as { reviewId?: unknown }).reviewId === 'string'
        ? (body as { reviewId: string }).reviewId
        : null;

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true },
    });

    if (!review || review.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      );
    }

    await prisma.review.delete({ where: { id: reviewId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
