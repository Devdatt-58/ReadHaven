import { prisma } from '@/lib/prisma';

const DEFAULT_SHELVES = ['Want to Read', 'Currently Reading', 'Read'] as const;

function normalizeShelfName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function ensureDefaultShelves(userId: string) {
  const existingShelves = await prisma.shelf.findMany({
    where: { userId },
    select: { name: true },
  });

  const existingNames = new Set(existingShelves.map((shelf) => normalizeShelfName(shelf.name)));
  const missingShelves = DEFAULT_SHELVES.filter(
    (name) => !existingNames.has(normalizeShelfName(name))
  );

  if (missingShelves.length === 0) {
    return;
  }

  await prisma.shelf.createMany({
    data: missingShelves.map((name) => ({
      userId,
      name,
      isDefault: true,
    })),
    skipDuplicates: true,
  });
}
