import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const friendshipId =
      body && typeof (body as { friendshipId?: unknown }).friendshipId === 'string'
        ? (body as { friendshipId: string }).friendshipId
        : null;

    if (!friendshipId) {
      return NextResponse.json({ error: 'Friendship ID is required' }, { status: 400 });
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
      select: { userId: true, friendId: true },
    });

    if (
      !friendship ||
      (friendship.userId !== session.user.id && friendship.friendId !== session.user.id)
    ) {
      return NextResponse.json(
        { error: 'Friendship not found or unauthorized' },
        { status: 404 }
      );
    }

    await prisma.friendship.delete({ where: { id: friendshipId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove friend error:', error);
    return NextResponse.json({ error: 'Failed to remove friend' }, { status: 500 });
  }
}
