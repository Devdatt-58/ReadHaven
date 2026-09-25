import type { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import FriendsPageClient from './FriendsPageClient';

type FriendshipWithUsers = Prisma.FriendshipGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
      };
    };
    friend: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
      };
    };
  };
}>;

type ActivityWithUser = Prisma.ActivityGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
  };
}>;

type FriendsData = {
  friends: FriendshipWithUsers[];
  pendingRequests: FriendshipWithUsers[];
  sentRequests: FriendshipWithUsers[];
  activities: ActivityWithUser[];
};

async function getFriendsData(userId: string): Promise<FriendsData> {
  const [friends, pendingRequests, sentRequests, activities] = await Promise.all([
    // Accepted friends
    prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    }),
    // Pending requests received
    prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    }),
    // Pending requests sent
    prisma.friendship.findMany({
      where: {
        userId,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    }),
    // Recent activity from friends
    prisma.activity.findMany({
      where: {
        user: {
          OR: [
            {
              friendshipsInitiated: {
                some: {
                  friendId: userId,
                  status: 'accepted',
                },
              },
            },
            {
              friendshipsReceived: {
                some: {
                  userId,
                  status: 'accepted',
                },
              },
            },
          ],
        },
      },
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
    }),
  ]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    activities,
  };
}

export default async function FriendsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const friendsData = await getFriendsData(session.user.id);

  return <FriendsPageClient data={friendsData} currentUserId={session.user.id} />;
}
