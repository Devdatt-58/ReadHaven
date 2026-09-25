import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ShelfPageClient from './ShelfPageClient';
import { ensureDefaultShelves } from '@/lib/shelves';
import { shelfNameToSlug } from '@/lib/shelf-slug';

interface PageProps {
  params: Promise<{
    name: string;
  }>;
}

async function getShelfData(userId: string, shelfSlug: string) {
  await ensureDefaultShelves(userId);

  const decodedSlug = decodeURIComponent(shelfSlug).trim();
  const normalizedSlug = decodedSlug.toLowerCase();
  const normalizedName = normalizedSlug.replace(/-/g, ' ').trim();

  const shelfByName = await prisma.shelf.findFirst({
    where: {
      userId,
      OR: [
        {
          name: {
            equals: normalizedName,
            mode: 'insensitive',
          },
        },
        {
          name: {
            equals: decodedSlug,
            mode: 'insensitive',
          },
        },
      ],
    },
    include: {
      books: {
        orderBy: {
          addedAt: 'desc',
        },
      },
    },
  });

  if (shelfByName) {
    return shelfByName;
  }

  const userShelves = await prisma.shelf.findMany({
    where: { userId },
    include: {
      books: {
        orderBy: {
          addedAt: 'desc',
        },
      },
    },
  });

  return (
    userShelves.find(
      (candidate) => normalizedSlug === shelfNameToSlug(candidate.name)
    ) ?? null
  );
}

export default async function ShelfPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const shelf = await getShelfData(session.user.id, resolvedParams.name);
  const attemptedShelf = decodeURIComponent(resolvedParams.name);
  const displayShelfName = attemptedShelf.replace(/-/g, ' ').trim() || attemptedShelf;

  if (!shelf) {
    return (
      <div className="shelf-not-found">
        <h1>Shelf not found</h1>
        <p>{`The shelf "${displayShelfName || '(unknown)'}" does not exist.`}</p>
      </div>
    );
  }

  return <ShelfPageClient shelf={shelf} user={session.user} />;
}
