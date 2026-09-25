jest.mock('@/lib/prisma', () => ({
  prisma: { activity: { create: jest.fn() } },
}));

import { recordActivity } from '@/lib/activity';
import { prisma } from '@/lib/prisma';

const create = prisma.activity.create as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('recordActivity', () => {
  it('creates an activity row from the input', async () => {
    create.mockResolvedValue({});
    await recordActivity({
      userId: 'u-1',
      type: 'added_book',
      bookId: 'b-1',
      bookTitle: 'Dune',
    });
    expect(create).toHaveBeenCalledTimes(1);
    const data = (create.mock.calls[0][0] as { data: Record<string, unknown> }).data;
    expect(data.userId).toBe('u-1');
    expect(data.type).toBe('added_book');
    expect(data.bookCover).toBeNull();
  });

  it('swallows errors so the caller is not affected', async () => {
    create.mockRejectedValue(new Error('db down'));
    await expect(
      recordActivity({ userId: 'u-1', type: 'added_book' })
    ).resolves.toBeUndefined();
  });
});
