jest.mock('@/lib/prisma', () => ({
  prisma: { user: { findFirst: jest.fn() } },
}));
jest.mock('bcryptjs', () => ({ compare: jest.fn() }));
jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({})),
}));

import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const findFirst = prisma.user.findFirst as jest.Mock;
const compare = bcrypt.compare as jest.Mock;

function authorize(credentials: unknown) {
  // next-auth v4 stores the user-supplied provider config (including our
  // authorize callback) under `.options`.
  const provider = authOptions.providers.find(
    (p) => (p as { id?: string }).id === 'credentials'
  ) as unknown as {
    options: { authorize: (c: unknown) => Promise<unknown> };
  };
  return provider.options.authorize(credentials);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('credentials authorize', () => {
  it('rejects when credentials are missing', async () => {
    await expect(authorize({})).rejects.toThrow();
  });

  it('rejects when no user exists for the email', async () => {
    findFirst.mockResolvedValue(null);
    await expect(
      authorize({ email: 'a@b.c', password: 'secret123' })
    ).rejects.toThrow();
  });

  it('rejects when the password does not match', async () => {
    findFirst.mockResolvedValue({ id: 'u-1', password: 'hashed' });
    compare.mockResolvedValue(false);
    await expect(
      authorize({ email: 'a@b.c', password: 'wrong' })
    ).rejects.toThrow();
  });

  it('returns the user when the password matches', async () => {
    const user = { id: 'u-1', email: 'a@b.c', password: 'hashed' };
    findFirst.mockResolvedValue(user);
    compare.mockResolvedValue(true);
    await expect(
      authorize({ email: 'a@b.c', password: 'secret123' })
    ).resolves.toEqual(user);
  });
});

describe('session and jwt callbacks', () => {
  it('jwt copies the user id onto the token', async () => {
    const token = await authOptions.callbacks!.jwt!({
      token: {},
      user: { id: 'u-1' },
    } as never);
    expect((token as { sub?: string }).sub).toBe('u-1');
  });

  it('session exposes the user id from the token', async () => {
    const session = await authOptions.callbacks!.session!({
      session: { user: { name: 'A' } },
      token: { sub: 'u-1' },
    } as never);
    expect((session.user as { id?: string }).id).toBe('u-1');
  });
});
