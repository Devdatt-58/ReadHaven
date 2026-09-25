import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateWithSchema } from '@/lib/validation';

const friendAcceptBodySchema = z.object({
  friendshipId: z.string().trim().min(1, 'Friendship ID is required'),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const parsedBody = await request.json().catch(() => null);

    const bodyValidation = validateWithSchema(
      friendAcceptBodySchema,
      parsedBody
    );
    if (!bodyValidation.success) {
      return NextResponse.json(
        { error: bodyValidation.error },
        { status: 400 }
      );
    }

    const { friendshipId } = bodyValidation.data;

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
      select: { friendId: true, status: true },
    });

    if (!friendship || friendship.friendId !== session.user.id) {
      return NextResponse.json(
        { error: 'Friendship not found or unauthorized' },
        { status: 404 }
      );
    }

    if (friendship.status !== 'pending') {
      return NextResponse.json(
        { error: 'Friend request is no longer pending' },
        { status: 400 }
      );
    }

    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Accept friend error:', error);
    return NextResponse.json(
      { error: 'Failed to accept friend request' },
      { status: 500 }
    );
  }
}
