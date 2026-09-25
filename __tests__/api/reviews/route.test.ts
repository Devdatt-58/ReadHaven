jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    review: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { POST, GET, DELETE } from '@/app/api/reviews/route';
import { prisma } from '@/lib/prisma';
import { mockRequest, setSession } from '../../helpers';

const review = prisma.review as jest.Mocked<typeof prisma.review>;

beforeEach(() => {
  jest.clearAllMocks();
  setSession('user-1');
});

describe('POST /api/reviews', () => {
  it('creates a new review (201)', async () => {
    review.findFirst.mockResolvedValue(null);
    review.create.mockResolvedValue({ id: 'r-1' } as any);
    const res = await POST(
      mockRequest('http://t/api/reviews', {
        method: 'POST',
        json: { bookId: 'b-1', rating: 5, content: 'Great' },
      })
    );
    expect(res.status).toBe(201);
    expect(review.create).toHaveBeenCalled();
  });

  it('updates an existing review (200)', async () => {
    review.findFirst.mockResolvedValue({ id: 'r-1' } as any);
    review.update.mockResolvedValue({ id: 'r-1' } as any);
    const res = await POST(
      mockRequest('http://t/api/reviews', {
        method: 'POST',
        json: { bookId: 'b-1', rating: 4 },
      })
    );
    expect(res.status).toBe(200);
    expect(review.update).toHaveBeenCalled();
  });

  it('rejects unauthenticated (401)', async () => {
    setSession(null);
    const res = await POST(
      mockRequest('http://t/api/reviews', {
        method: 'POST',
        json: { bookId: 'b-1', rating: 5 },
      })
    );
    expect(res.status).toBe(401);
  });

  it('rejects malformed body (400)', async () => {
    const res = await POST(
      mockRequest('http://t/api/reviews', {
        method: 'POST',
        body: 'not json',
        headers: { 'content-type': 'application/json' },
      })
    );
    expect(res.status).toBe(400);
  });

  it('rejects missing bookId (400)', async () => {
    const res = await POST(
      mockRequest('http://t/api/reviews', {
        method: 'POST',
        json: { rating: 5 },
      })
    );
    expect(res.status).toBe(400);
  });

  it('rejects out-of-range rating (400)', async () => {
    const res = await POST(
      mockRequest('http://t/api/reviews', {
        method: 'POST',
        json: { bookId: 'b-1', rating: 99 },
      })
    );
    expect(res.status).toBe(400);
  });

  it('rejects oversized content (400)', async () => {
    const res = await POST(
      mockRequest('http://t/api/reviews', {
        method: 'POST',
        json: { bookId: 'b-1', rating: 5, content: 'x'.repeat(5000) },
      })
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /api/reviews', () => {
  it('returns list for a bookId', async () => {
    review.findMany.mockResolvedValue([{ id: 'r-1' }] as any);
    review.count.mockResolvedValue(1);
    const res = await GET(mockRequest('http://t/api/reviews?bookId=b-1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.items).toHaveLength(1);
  });

  it('rejects missing bookId (400)', async () => {
    const res = await GET(mockRequest('http://t/api/reviews'));
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/reviews', () => {
  it('deletes the user own review', async () => {
    review.findUnique.mockResolvedValue({ id: 'r-1', userId: 'user-1' } as any);
    review.delete.mockResolvedValue({ id: 'r-1' } as any);
    const res = await DELETE(
      mockRequest('http://t/api/reviews', {
        method: 'DELETE',
        json: { reviewId: 'r-1' },
      })
    );
    expect(res.status).toBe(200);
  });

  it('rejects unauthenticated (401)', async () => {
    setSession(null);
    const res = await DELETE(
      mockRequest('http://t/api/reviews', {
        method: 'DELETE',
        json: { reviewId: 'r-1' },
      })
    );
    expect(res.status).toBe(401);
  });

  it('rejects missing reviewId (400)', async () => {
    const res = await DELETE(
      mockRequest('http://t/api/reviews', { method: 'DELETE', json: {} })
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when not owner', async () => {
    review.findUnique.mockResolvedValue({ id: 'r-1', userId: 'other' } as any);
    const res = await DELETE(
      mockRequest('http://t/api/reviews', {
        method: 'DELETE',
        json: { reviewId: 'r-1' },
      })
    );
    expect(res.status).toBe(404);
  });
});
