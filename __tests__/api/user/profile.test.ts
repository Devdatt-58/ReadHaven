jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/prisma', () => ({
  prisma: { user: { update: jest.fn() } },
}));

import { PATCH } from '@/app/api/user/profile/route';
import { prisma } from '@/lib/prisma';
import { mockRequest, setSession } from '../../helpers';

const user = prisma.user as jest.Mocked<typeof prisma.user>;

beforeEach(() => {
  jest.clearAllMocks();
  setSession('user-1');
});

describe('PATCH /api/user/profile', () => {
  it('updates profile', async () => {
    user.update.mockResolvedValue({ id: 'user-1', name: 'New' } as any);
    const res = await PATCH(
      mockRequest('http://t', {
        method: 'PATCH',
        json: { name: 'New', bio: 'b', website: 'example.com' },
      })
    );
    expect(res.status).toBe(200);
    const data = (user.update.mock.calls[0][0] as any).data;
    expect(data.website).toBe('https://example.com/');
  });

  it('normalises http websites', async () => {
    user.update.mockResolvedValue({} as any);
    await PATCH(
      mockRequest('http://t', {
        method: 'PATCH',
        json: { website: 'http://ok.test' },
      })
    );
    expect((user.update.mock.calls[0][0] as any).data.website).toMatch(
      /^https?:\/\/ok\.test/
    );
  });

  it('rejects invalid website', async () => {
    user.update.mockResolvedValue({} as any);
    await PATCH(
      mockRequest('http://t', {
        method: 'PATCH',
        json: { website: '::::not a url' },
      })
    );
    expect((user.update.mock.calls[0][0] as any).data.website).toBeNull();
  });

  it('401 unauthenticated', async () => {
    setSession(null);
    const res = await PATCH(
      mockRequest('http://t', { method: 'PATCH', json: { name: 'x' } })
    );
    expect(res.status).toBe(401);
  });

  it('400 malformed body', async () => {
    const res = await PATCH(
      mockRequest('http://t', {
        method: 'PATCH',
        body: 'nope',
        headers: { 'content-type': 'application/json' },
      })
    );
    expect(res.status).toBe(400);
  });
});
