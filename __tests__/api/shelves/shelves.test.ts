jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/shelves', () => ({ ensureDefaultShelves: jest.fn() }));
jest.mock('@/lib/activity', () => ({ recordActivity: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    shelf: { findFirst: jest.fn() },
    shelfBook: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { POST as addBook } from '@/app/api/shelves/add-book/route';
import { POST as removeBook } from '@/app/api/shelves/remove-book/route';
import { prisma } from '@/lib/prisma';
import { mockRequest, setSession } from '../../helpers';

const shelf = prisma.shelf as jest.Mocked<typeof prisma.shelf>;
const shelfBook = prisma.shelfBook as jest.Mocked<typeof prisma.shelfBook>;

beforeEach(() => {
  jest.clearAllMocks();
  setSession('user-1');
});

describe('POST /api/shelves/add-book', () => {
  const validBody = {
    shelfId: 's-1',
    bookId: 'b-1',
    bookData: { title: 'Dune', authors: ['Frank Herbert'], thumbnail: 'x.jpg' },
  };

  it('adds book (201)', async () => {
    shelf.findFirst.mockResolvedValue({ id: 's-1' } as any);
    shelfBook.findUnique.mockResolvedValue(null);
    shelfBook.create.mockResolvedValue({ id: 'sb-1' } as any);
    const res = await addBook(
      mockRequest('http://t', { method: 'POST', json: validBody })
    );
    expect(res.status).toBe(201);
  });

  it('401 unauthenticated', async () => {
    setSession(null);
    const res = await addBook(
      mockRequest('http://t', { method: 'POST', json: validBody })
    );
    expect(res.status).toBe(401);
  });

  it('400 missing fields', async () => {
    const res = await addBook(
      mockRequest('http://t', { method: 'POST', json: { shelfId: 's-1' } })
    );
    expect(res.status).toBe(400);
  });

  it('400 missing title', async () => {
    const res = await addBook(
      mockRequest('http://t', {
        method: 'POST',
        json: { shelfId: 's-1', bookId: 'b-1', bookData: { authors: [] } },
      })
    );
    expect(res.status).toBe(400);
  });

  it('404 when shelf not owned', async () => {
    shelf.findFirst.mockResolvedValue(null);
    const res = await addBook(
      mockRequest('http://t', { method: 'POST', json: validBody })
    );
    expect(res.status).toBe(404);
  });

  it('409 when duplicate', async () => {
    shelf.findFirst.mockResolvedValue({ id: 's-1' } as any);
    shelfBook.findUnique.mockResolvedValue({ id: 'sb-1' } as any);
    const res = await addBook(
      mockRequest('http://t', { method: 'POST', json: validBody })
    );
    expect(res.status).toBe(409);
  });
});

describe('POST /api/shelves/remove-book', () => {
  it('removes when owner', async () => {
    shelfBook.findUnique.mockResolvedValue({
      id: 'sb-1',
      shelf: { userId: 'user-1' },
    } as any);
    shelfBook.delete.mockResolvedValue({ id: 'sb-1' } as any);
    const res = await removeBook(
      mockRequest('http://t', { method: 'POST', json: { shelfBookId: 'sb-1' } })
    );
    expect(res.status).toBe(200);
  });

  it('404 when not owner', async () => {
    shelfBook.findUnique.mockResolvedValue({
      id: 'sb-1',
      shelf: { userId: 'other' },
    } as any);
    const res = await removeBook(
      mockRequest('http://t', { method: 'POST', json: { shelfBookId: 'sb-1' } })
    );
    expect(res.status).toBe(404);
  });

  it('400 missing id', async () => {
    const res = await removeBook(
      mockRequest('http://t', { method: 'POST', json: {} })
    );
    expect(res.status).toBe(400);
  });

  it('401 unauthenticated', async () => {
    setSession(null);
    const res = await removeBook(
      mockRequest('http://t', { method: 'POST', json: { shelfBookId: 'sb-1' } })
    );
    expect(res.status).toBe(401);
  });
});
