import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBoundedInt } from '@/lib/validation';

const MAX_POST_LENGTH = 2000;

function cleanOptionalString(value: unknown, max = 500): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

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

    const content =
      typeof (body as { content?: unknown }).content === 'string'
        ? (body as { content: string }).content.trim()
        : '';

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > MAX_POST_LENGTH) {
      return NextResponse.json(
        { error: `Post content must be ${MAX_POST_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    const { bookId, bookTitle, bookCover, bookAuthors } = body as Record<string, unknown>;

    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        content,
        bookId: cleanOptionalString(bookId, 100),
        bookTitle: cleanOptionalString(bookTitle, 300),
        bookCover: cleanOptionalString(bookCover, 500),
        bookAuthors: cleanOptionalString(bookAuthors, 300),
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInt(searchParams.get('limit'), {
      defaultValue: 10,
      min: 1,
      max: 50,
    });

    const posts = await prisma.post.findMany({
      include: {
        user: { select: { id: true, name: true, image: true } },
        likes: { select: { id: true, userId: true } },
        comments: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Fetch posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
