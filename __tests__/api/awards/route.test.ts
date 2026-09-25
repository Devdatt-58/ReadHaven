jest.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({ ok: true, retryAfter: 0 }),
}));

import { POST } from '@/app/api/awards/route';
import { mockRequest } from '../../helpers';

const originalFetch = global.fetch;
const originalGroqKey = process.env.GROQ_API_KEY;

afterEach(() => {
  global.fetch = originalFetch;
  process.env.GROQ_API_KEY = originalGroqKey;
});

describe('POST /api/awards', () => {
  it('400 when category missing', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    const res = await POST(
      mockRequest('http://t/api/awards', { method: 'POST', json: {} })
    );
    expect(res.status).toBe(400);
  });

  it('503 when GROQ_API_KEY missing', async () => {
    delete process.env.GROQ_API_KEY;
    const res = await POST(
      mockRequest('http://t/api/awards', {
        method: 'POST',
        json: { category: 'sci-fi' },
      })
    );
    expect(res.status).toBe(503);
  });

  it('502 when groq returns invalid JSON', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'not json at all' } }],
      }),
    }) as any;

    const res = await POST(
      mockRequest('http://t/api/awards', {
        method: 'POST',
        json: { category: 'sci-fi' },
      })
    );
    expect(res.status).toBe(502);
  });

  it('502 when groq HTTP fails', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => 'upstream down',
    }) as any;
    const res = await POST(
      mockRequest('http://t/api/awards', {
        method: 'POST',
        json: { category: 'sci-fi' },
      })
    );
    expect(res.status).toBe(502);
  });

  it('falls back to category search when book lookups return little', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    global.fetch = jest.fn((url: any) => {
      const u = String(url);
      if (u.includes('groq.com')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: '[{"title":"Nonexistent","author":"Nobody"}]',
                },
              },
            ],
          }),
        });
      }
      if (u.includes('/api/books/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            books: [
              {
                id: 'fallback-1',
                title: 'Fallback',
                authors: ['X'],
                thumbnail: 't.jpg',
                averageRating: 0,
                ratingsCount: 0,
                publishedDate: '',
              },
              {
                id: 'fallback-2',
                title: 'Another',
                authors: ['Y'],
                thumbnail: 't.jpg',
                averageRating: 0,
                ratingsCount: 0,
                publishedDate: '',
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: false });
    }) as any;

    const res = await POST(
      mockRequest('http://t/api/awards', {
        method: 'POST',
        json: { category: 'best classics 2024' },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.books.length).toBeGreaterThan(0);
  });

  it('200 with books when groq + lookups succeed', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    global.fetch = jest.fn((url: any) => {
      const u = String(url);
      if (u.includes('groq.com')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content:
                    '[{"title":"Dune","author":"Frank Herbert"},{"title":"Foundation","author":"Isaac Asimov"}]',
                },
              },
            ],
          }),
        });
      }
      if (u.includes('/api/books/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            books: [
              {
                id: 'book-1',
                title: 'Dune',
                authors: ['Frank Herbert'],
                thumbnail: 't.jpg',
                averageRating: 4.5,
                ratingsCount: 100,
                publishedDate: '1965',
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: false });
    }) as any;

    const res = await POST(
      mockRequest('http://t/api/awards', {
        method: 'POST',
        json: { category: 'sci-fi' },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.books)).toBe(true);
  });
});
