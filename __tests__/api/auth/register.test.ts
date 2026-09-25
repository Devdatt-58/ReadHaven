jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('hashed') }));

import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';
import { mockRequest } from '../../helpers';

const user = prisma.user as jest.Mocked<typeof prisma.user>;
const $transaction = prisma.$transaction as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  it('registers a new user (201)', async () => {
    user.findFirst.mockResolvedValue(null);
    $transaction.mockResolvedValue({
      id: 'u-1',
      name: 'A',
      email: 'a@b.c',
    });
    const res = await POST(
      mockRequest('http://t', {
        method: 'POST',
        json: { name: 'A', email: 'a@b.c', password: 'longenough' },
      })
    );
    expect(res.status).toBe(201);
  });

  it('400 missing fields', async () => {
    const res = await POST(
      mockRequest('http://t', {
        method: 'POST',
        json: { name: 'A', password: 'longenough' },
      })
    );
    expect(res.status).toBe(400);
  });

  it('400 short password', async () => {
    const res = await POST(
      mockRequest('http://t', {
        method: 'POST',
        json: { name: 'A', email: 'a@b.c', password: 'short' },
      })
    );
    expect(res.status).toBe(400);
  });

  it('400 password too long', async () => {
    const res = await POST(
      mockRequest('http://t', {
        method: 'POST',
        json: { name: 'A', email: 'a@b.c', password: 'x'.repeat(100) },
      })
    );
    expect(res.status).toBe(400);
  });

  it('400 when email exists', async () => {
    user.findFirst.mockResolvedValue({ id: 'u-1' } as any);
    const res = await POST(
      mockRequest('http://t', {
        method: 'POST',
        json: { name: 'A', email: 'a@b.c', password: 'longenough' },
      })
    );
    expect(res.status).toBe(400);
  });

  it('runs transaction (callback creates user + shelves)', async () => {
    user.findFirst.mockResolvedValue(null);
    const createUser = jest.fn().mockResolvedValue({
      id: 'u-1',
      name: 'A',
      email: 'a@b.c',
    });
    const createMany = jest.fn().mockResolvedValue({ count: 3 });
    $transaction.mockImplementation(async (cb: any) =>
      cb({ user: { create: createUser }, shelf: { createMany } })
    );
    const res = await POST(
      mockRequest('http://t', {
        method: 'POST',
        json: { name: 'A', email: 'a@b.c', password: 'longenough' },
      })
    );
    expect(res.status).toBe(201);
    expect(createUser).toHaveBeenCalled();
    expect(createMany).toHaveBeenCalled();
    const data = createMany.mock.calls[0][0].data;
    expect(data).toHaveLength(3);
  });

  it('400 on Prisma email unique violation (P2002)', async () => {
    user.findFirst.mockResolvedValue(null);
    const { Prisma } = require('@prisma/client');
    const err = new Prisma.PrismaClientKnownRequestError('unique', {
      code: 'P2002',
      clientVersion: 'x',
      meta: { target: ['email'] },
    });
    $transaction.mockRejectedValue(err);
    const res = await POST(
      mockRequest('http://t', {
        method: 'POST',
        json: { name: 'A', email: 'a@b.c', password: 'longenough' },
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });

  it('500 on unknown error', async () => {
    user.findFirst.mockRejectedValue(new Error('boom'));
    const res = await POST(
      mockRequest('http://t', {
        method: 'POST',
        json: { name: 'A', email: 'a@b.c', password: 'longenough' },
      })
    );
    expect(res.status).toBe(500);
  });
});
