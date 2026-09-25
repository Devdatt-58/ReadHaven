import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_NAME_LENGTH = 80;
const MAX_BIO_LENGTH = 280;
const MAX_LOCATION_LENGTH = 80;
const MAX_WEBSITE_LENGTH = 200;

function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function cleanWebsite(value: unknown): string | null {
  const cleaned = cleanString(value, MAX_WEBSITE_LENGTH);
  if (!cleaned) return null;
  try {
    const url = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, bio, location, website } = body as Record<string, unknown>;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: cleanString(name, MAX_NAME_LENGTH),
        bio: cleanString(bio, MAX_BIO_LENGTH),
        location: cleanString(location, MAX_LOCATION_LENGTH),
        website: cleanWebsite(website),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        website: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
