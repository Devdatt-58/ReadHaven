jest.mock('@/lib/prisma', () => ({
  prisma: {
    shelf: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

import { ensureDefaultShelves } from '@/lib/shelves';
import { prisma } from '@/lib/prisma';

const shelf = prisma.shelf as jest.Mocked<typeof prisma.shelf>;

describe('ensureDefaultShelves', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates all three when none exist', async () => {
    shelf.findMany.mockResolvedValue([]);
    shelf.createMany.mockResolvedValue({ count: 3 } as any);
    await ensureDefaultShelves('u-1');
    expect(shelf.createMany).toHaveBeenCalled();
    const data = (shelf.createMany.mock.calls[0][0] as any).data;
    expect(data).toHaveLength(3);
  });

  it('does nothing when all exist', async () => {
    shelf.findMany.mockResolvedValue([
      { name: 'Want to Read' },
      { name: 'Currently Reading' },
      { name: 'Read' },
    ] as any);
    await ensureDefaultShelves('u-1');
    expect(shelf.createMany).not.toHaveBeenCalled();
  });

  it('creates only the missing ones', async () => {
    shelf.findMany.mockResolvedValue([{ name: 'Read' }] as any);
    shelf.createMany.mockResolvedValue({ count: 2 } as any);
    await ensureDefaultShelves('u-1');
    const data = (shelf.createMany.mock.calls[0][0] as any).data;
    expect(data).toHaveLength(2);
  });
});
