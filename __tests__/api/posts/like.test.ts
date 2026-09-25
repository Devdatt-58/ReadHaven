jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    like: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { POST } from '@/app/api/posts/like/route';
import { prisma } from '@/lib/prisma';
import { mockRequest, setSession } from '../../helpers';

const like = prisma.like as jest.Mocked<typeof prisma.like>;

beforeEach(() => {
  jest.clearAllMocks();
  setSession('user-1');
});

describe('POST /api/posts/like', () => {
  it('creates a like when none exists', async () => {
    like.findUnique.mockResolvedValue(null);
    like.create.mockResolvedValue({ id: 'l-1' } as any);
    const res = await POST(
      mockRequest('http://t/api/posts/like', {
        method: 'POST',
        json: { postId: 'p-1' },
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ liked: true });
  });

  it('unlikes when one exists', async () => {
    like.findUnique.mockResolvedValue({ id: 'l-1' } as any);
    like.delete.mockResolvedValue({ id: 'l-1' } as any);
    const res = await POST(
      mockRequest('http://t/api/posts/like', {
        method: 'POST',
        json: { postId: 'p-1' },
      })
    );
    expect(await res.json()).toEqual({ liked: false });
  });

  it('rejects unauthenticated (401)', async () => {
    setSession(null);
    const res = await POST(
      mockRequest('http://t/api/posts/like', {
        method: 'POST',
        json: { postId: 'p-1' },
      })
    );
    expect(res.status).toBe(401);
  });

  it('rejects missing postId (400)', async () => {
    const res = await POST(
      mockRequest('http://t/api/posts/like', { method: 'POST', json: {} })
    );
    expect(res.status).toBe(400);
  });

  it('treats a concurrent like (P2002) as already liked', async () => {
    like.findUnique.mockResolvedValue(null);
    const { Prisma } = require('@prisma/client');
    like.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'x',
      })
    );
    const res = await POST(
      mockRequest('http://t/api/posts/like', {
        method: 'POST',
        json: { postId: 'p-1' },
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ liked: true });
  });

  it('404 when postId references no post (P2003)', async () => {
    like.findUnique.mockResolvedValue(null);
    const { Prisma } = require('@prisma/client');
    like.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('fk violation', {
        code: 'P2003',
        clientVersion: 'x',
      })
    );
    const res = await POST(
      mockRequest('http://t/api/posts/like', {
        method: 'POST',
        json: { postId: 'missing' },
      })
    );
    expect(res.status).toBe(404);
  });
});
