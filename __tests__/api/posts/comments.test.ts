jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    comment: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
    },
  },
}));

import { GET, POST } from '@/app/api/posts/[id]/comments/route';
import { prisma } from '@/lib/prisma';
import { mockRequest, setSession } from '../../helpers';

const comment = prisma.comment as jest.Mocked<typeof prisma.comment>;
const post = prisma.post as jest.Mocked<typeof prisma.post>;

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  jest.clearAllMocks();
  setSession('user-1');
});

describe('GET /api/posts/[id]/comments', () => {
  it('returns comments without cursor', async () => {
    comment.findMany.mockResolvedValue([{ id: 'c-1' }] as any);
    const res = await GET(mockRequest('http://t/'), ctx('p-1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.comments).toHaveLength(1);
    expect(body.hasMore).toBe(false);
  });

  it('reports hasMore + nextCursor when page is full', async () => {
    comment.findMany.mockResolvedValue(
      Array.from({ length: 21 }, (_, i) => ({ id: `c-${i}` })) as any
    );
    const res = await GET(mockRequest('http://t/?limit=20'), ctx('p-1'));
    const body = await res.json();
    expect(body.hasMore).toBe(true);
    expect(body.nextCursor).toBe('c-19');
  });

  it('applies cursor', async () => {
    comment.findMany.mockResolvedValue([] as any);
    await GET(mockRequest('http://t/?cursor=c-5'), ctx('p-1'));
    expect((comment.findMany.mock.calls[0][0] as any).cursor).toEqual({ id: 'c-5' });
  });

  it('clamps limit', async () => {
    comment.findMany.mockResolvedValue([] as any);
    await GET(mockRequest('http://t/?limit=9999'), ctx('p-1'));
    expect((comment.findMany.mock.calls[0][0] as any).take).toBeLessThanOrEqual(51);
  });
});

describe('POST /api/posts/[id]/comments', () => {
  it('creates comment', async () => {
    post.findUnique.mockResolvedValue({ id: 'p-1' } as any);
    comment.create.mockResolvedValue({ id: 'c-1' } as any);
    const res = await POST(
      mockRequest('http://t/', { method: 'POST', json: { content: 'hello' } }),
      ctx('p-1')
    );
    expect(res.status).toBe(201);
  });

  it('401 unauthenticated', async () => {
    setSession(null);
    const res = await POST(
      mockRequest('http://t/', { method: 'POST', json: { content: 'hi' } }),
      ctx('p-1')
    );
    expect(res.status).toBe(401);
  });

  it('400 empty content', async () => {
    const res = await POST(
      mockRequest('http://t/', { method: 'POST', json: { content: '   ' } }),
      ctx('p-1')
    );
    expect(res.status).toBe(400);
  });

  it('400 oversized content', async () => {
    const res = await POST(
      mockRequest('http://t/', {
        method: 'POST',
        json: { content: 'x'.repeat(2001) },
      }),
      ctx('p-1')
    );
    expect(res.status).toBe(400);
  });

  it('404 when post missing', async () => {
    post.findUnique.mockResolvedValue(null);
    const res = await POST(
      mockRequest('http://t/', { method: 'POST', json: { content: 'hi' } }),
      ctx('p-1')
    );
    expect(res.status).toBe(404);
  });
});
