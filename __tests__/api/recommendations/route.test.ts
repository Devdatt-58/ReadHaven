jest.mock('@/lib/recommendations', () => ({
  recommendForQuery: jest.fn(),
}));

import { GET } from '@/app/api/recommendations/route';
import { recommendForQuery } from '@/lib/recommendations';
import { mockRequest } from '../../helpers';

const recommend = recommendForQuery as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/recommendations', () => {
  it('returns books for a query', async () => {
    recommend.mockResolvedValue([{ id: 'b-1', title: 'Dune' }]);
    const res = await GET(mockRequest('http://t/?q=space+opera'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.books).toHaveLength(1);
  });

  it('400 when q is missing', async () => {
    const res = await GET(mockRequest('http://t/'));
    expect(res.status).toBe(400);
    expect(recommend).not.toHaveBeenCalled();
  });

  it('400 when q is only whitespace', async () => {
    const res = await GET(mockRequest('http://t/?q=%20%20'));
    expect(res.status).toBe(400);
  });

  it('clamps limit to a maximum of 20', async () => {
    recommend.mockResolvedValue([]);
    await GET(mockRequest('http://t/?q=dragons&limit=9999'));
    expect(recommend.mock.calls[0][1]).toBeLessThanOrEqual(20);
  });

  it('500 when the recommender throws', async () => {
    recommend.mockRejectedValue(new Error('db down'));
    const res = await GET(mockRequest('http://t/?q=dragons'));
    expect(res.status).toBe(500);
  });
});
