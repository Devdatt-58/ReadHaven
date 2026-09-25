jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { POST, GET } from '@/app/api/posts/route';
import { prisma } from '@/lib/prisma';
import { mockRequest, setSession } from '../../helpers';

const post = prisma.post as jest.Mocked<typeof prisma.post>;

beforeEach(() => {
  jest.clearAllMocks();
  setSession('user-1');
});

describe('POST /api/posts', () => {
  it('creates a post (201)', async () => {
    post.create.mockResolvedValue({ id: 'p-1', content: 'hi' } as any);
    const res = await POST(
      mockRequest('http://t/api/posts', {
        method: 'POST',
        json: { content: 'hello world' },
      })
    );
    expect(res.status).toBe(201);
    expect(post.create).toHaveBeenCalled();
  });

  it('attaches optional book metadata', async () => {
    post.create.mockResolvedValue({ id: 'p-1' } as any);
    await POST(
      mockRequest('http://t/api/posts', {
        method: 'POST',
        json: {
          content: 'on this book',
          bookId: 'b-1',
          bookTitle: 'T',
          bookCover: 'c.jpg',
          bookAuthors: 'A',
        },
      })
    );
    const data = (post.create.mock.calls[0][0] as any).data;
    expect(data.bookId).toBe('b-1');
    expect(data.bookTitle).toBe('T');
  });

  it('rejects unauthenticated (401)', async () => {
    setSession(null);
    const res = await POST(
      mockRequest('http://t/api/posts', {
        method: 'POST',
        json: { content: 'hi' },
      })
    );
    expect(res.status).toBe(401);
  });

  it('rejects empty content (400)', async () => {
    const res = await POST(
      mockRequest('http://t/api/posts', {
        method: 'POST',
        json: { content: '   ' },
      })
    );
    expect(res.status).toBe(400);
  });

  it('rejects oversized content (400)', async () => {
    const res = await POST(
      mockRequest('http://t/api/posts', {
        method: 'POST',
        json: { content: 'x'.repeat(2001) },
      })
    );
    expect(res.status).toBe(400);
  });

  it('rejects malformed body (400)', async () => {
    const res = await POST(
      mockRequest('http://t/api/posts', {
        method: 'POST',
        body: 'nope',
        headers: { 'content-type': 'application/json' },
      })
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /api/posts', () => {
  it('returns posts with default limit', async () => {
    post.findMany.mockResolvedValue([{ id: 'p-1' }] as any);
    const res = await GET(mockRequest('http://t/api/posts'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });

  it('honours limit parameter', async () => {
    post.findMany.mockResolvedValue([] as any);
    await GET(mockRequest('http://t/api/posts?limit=5'));
    expect(post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
  });

  it('clamps invalid limit to default', async () => {
    post.findMany.mockResolvedValue([] as any);
    await GET(mockRequest('http://t/api/posts?limit=9999'));
    expect((post.findMany.mock.calls[0][0] as any).take).toBeLessThanOrEqual(50);
  });
});
