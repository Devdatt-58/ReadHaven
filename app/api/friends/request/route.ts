import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateWithSchema } from '@/lib/validation';

const friendRequestBodySchema = z.object({
  friendId: z.string().trim().min(1, 'Friend ID is required'),
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
      friendRequestBodySchema,
      parsedBody
    );
    if (!bodyValidation.success) {
      return NextResponse.json(
        { error: bodyValidation.error },
        { status: 400 }
      );
    }

    const { friendId } = bodyValidation.data;

    if (friendId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot add yourself as friend' },
        { status: 400 }
      );
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId },
          { userId: friendId, friendId: session.user.id },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Friendship already exists or pending' },
        { status: 400 }
      );
    }

    const friendship = await prisma.friendship.create({
      data: {
        userId: session.user.id,
        friendId,
        status: 'pending',
      },
    });

    return NextResponse.json(friendship, { status: 201 });
  } catch (error) {
    console.error('Friend request error:', error);
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}
