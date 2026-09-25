jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    friendship: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { GET as search } from '@/app/api/friends/search/route';
import { POST as request } from '@/app/api/friends/request/route';
import { POST as accept } from '@/app/api/friends/accept/route';
import { POST as remove } from '@/app/api/friends/remove/route';
import { prisma } from '@/lib/prisma';
import { mockRequest, setSession } from '../../helpers';

const user = prisma.user as jest.Mocked<typeof prisma.user>;
const friendship = prisma.friendship as jest.Mocked<typeof prisma.friendship>;

beforeEach(() => {
  jest.clearAllMocks();
  setSession('me');
});

describe('GET /api/friends/search', () => {
  it('returns user when found', async () => {
    user.findUnique.mockResolvedValue({
      id: 'other',
      name: 'O',
      email: 'a@b.c',
      image: null,
    } as any);
    const res = await search(mockRequest('http://t/?email=a@b.c'));
    expect(res.status).toBe(200);
  });

  it('401 when unauthenticated', async () => {
    setSession(null);
    const res = await search(mockRequest('http://t/?email=a@b.c'));
    expect(res.status).toBe(401);
  });

  it('400 when email missing', async () => {
    const res = await search(mockRequest('http://t/'));
    expect(res.status).toBe(400);
  });

  it('404 when not found', async () => {
    user.findUnique.mockResolvedValue(null);
    const res = await search(mockRequest('http://t/?email=a@b.c'));
    expect(res.status).toBe(404);
  });

  it('400 when searching self', async () => {
    user.findUnique.mockResolvedValue({ id: 'me' } as any);
    const res = await search(mockRequest('http://t/?email=a@b.c'));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/friends/request', () => {
  it('creates a pending friendship', async () => {
    friendship.findFirst.mockResolvedValue(null);
    friendship.create.mockResolvedValue({ id: 'f-1', status: 'pending' } as any);
    const res = await request(
      mockRequest('http://t', { method: 'POST', json: { friendId: 'other' } })
    );
    expect(res.status).toBe(201);
  });

  it('401 unauthenticated', async () => {
    setSession(null);
    const res = await request(
      mockRequest('http://t', { method: 'POST', json: { friendId: 'other' } })
    );
    expect(res.status).toBe(401);
  });

  it('400 when adding self', async () => {
    const res = await request(
      mockRequest('http://t', { method: 'POST', json: { friendId: 'me' } })
    );
    expect(res.status).toBe(400);
  });

  it('400 when friendship exists', async () => {
    friendship.findFirst.mockResolvedValue({ id: 'f-1' } as any);
    const res = await request(
      mockRequest('http://t', { method: 'POST', json: { friendId: 'other' } })
    );
    expect(res.status).toBe(400);
  });

  it('400 invalid body', async () => {
    const res = await request(
      mockRequest('http://t', { method: 'POST', json: {} })
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /api/friends/accept', () => {
  it('accepts when pending and target is me', async () => {
    friendship.findUnique.mockResolvedValue({
      friendId: 'me',
      status: 'pending',
    } as any);
    friendship.update.mockResolvedValue({ id: 'f-1', status: 'accepted' } as any);
    const res = await accept(
      mockRequest('http://t', { method: 'POST', json: { friendshipId: 'f-1' } })
    );
    expect(res.status).toBe(200);
  });

  it('404 when not target', async () => {
    friendship.findUnique.mockResolvedValue({
      friendId: 'other',
      status: 'pending',
    } as any);
    const res = await accept(
      mockRequest('http://t', { method: 'POST', json: { friendshipId: 'f-1' } })
    );
    expect(res.status).toBe(404);
  });

  it('400 when already accepted', async () => {
    friendship.findUnique.mockResolvedValue({
      friendId: 'me',
      status: 'accepted',
    } as any);
    const res = await accept(
      mockRequest('http://t', { method: 'POST', json: { friendshipId: 'f-1' } })
    );
    expect(res.status).toBe(400);
  });

  it('401 unauthenticated', async () => {
    setSession(null);
    const res = await accept(
      mockRequest('http://t', { method: 'POST', json: { friendshipId: 'f-1' } })
    );
    expect(res.status).toBe(401);
  });
});

describe('POST /api/friends/remove', () => {
  it('removes a friendship', async () => {
    friendship.findUnique.mockResolvedValue({
      userId: 'me',
      friendId: 'other',
    } as any);
    friendship.delete.mockResolvedValue({ id: 'f-1' } as any);
    const res = await remove(
      mockRequest('http://t', { method: 'POST', json: { friendshipId: 'f-1' } })
    );
    expect(res.status).toBe(200);
  });

  it('404 when not party to it', async () => {
    friendship.findUnique.mockResolvedValue({
      userId: 'a',
      friendId: 'b',
    } as any);
    const res = await remove(
      mockRequest('http://t', { method: 'POST', json: { friendshipId: 'f-1' } })
    );
    expect(res.status).toBe(404);
  });

  it('400 missing id', async () => {
    const res = await remove(mockRequest('http://t', { method: 'POST', json: {} }));
    expect(res.status).toBe(400);
  });

  it('401 unauthenticated', async () => {
    setSession(null);
    const res = await remove(
      mockRequest('http://t', { method: 'POST', json: { friendshipId: 'f-1' } })
    );
    expect(res.status).toBe(401);
  });
});
