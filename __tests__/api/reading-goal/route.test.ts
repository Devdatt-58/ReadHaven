jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    readingGoal: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { POST, GET } from '@/app/api/reading-goal/route';
import { prisma } from '@/lib/prisma';
import { mockRequest, setSession } from '../../helpers';

const goal = prisma.readingGoal as jest.Mocked<typeof prisma.readingGoal>;

beforeEach(() => {
  jest.clearAllMocks();
  setSession('user-1');
});

describe('POST /api/reading-goal', () => {
  it('upserts a goal', async () => {
    goal.upsert.mockResolvedValue({ id: 'g-1', year: 2026, target: 30 } as any);
    const res = await POST(
      mockRequest('http://t', {
        method: 'POST',
        json: { year: 2026, target: 30 },
      })
    );
    expect(res.status).toBe(200);
  });

  it('coerces string numerics', async () => {
    goal.upsert.mockResolvedValue({} as any);
    const res = await POST(
      mockRequest('http://t', {
        method: 'POST',
        json: { year: '2026', target: '30' },
      })
    );
    expect(res.status).toBe(200);
  });

  it('rejects unauthenticated (401)', async () => {
    setSession(null);
    const res = await POST(
      mockRequest('http://t', { method: 'POST', json: { year: 2026, target: 30 } })
    );
    expect(res.status).toBe(401);
  });

  it('rejects out-of-range target (400)', async () => {
    const res = await POST(
      mockRequest('http://t', {
        method: 'POST',
        json: { year: 2026, target: 99999 },
      })
    );
    expect(res.status).toBe(400);
  });

  it('rejects malformed body (400)', async () => {
    const res = await POST(
      mockRequest('http://t', {
        method: 'POST',
        json: 'not an object',
      })
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /api/reading-goal', () => {
  it('returns goal for given year', async () => {
    goal.findUnique.mockResolvedValue({ id: 'g-1' } as any);
    const res = await GET(mockRequest('http://t/?year=2026'));
    expect(res.status).toBe(200);
  });

  it('defaults year when missing', async () => {
    goal.findUnique.mockResolvedValue(null);
    const res = await GET(mockRequest('http://t/'));
    expect(res.status).toBe(200);
  });

  it('rejects unauthenticated (401)', async () => {
    setSession(null);
    const res = await GET(mockRequest('http://t/?year=2026'));
    expect(res.status).toBe(401);
  });

  it('rejects invalid year (400)', async () => {
    const res = await GET(mockRequest('http://t/?year=abc'));
    expect(res.status).toBe(400);
  });
});
