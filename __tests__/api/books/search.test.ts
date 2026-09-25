import { GET } from '@/app/api/books/search/route';
import { mockRequest } from '../../helpers';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe('GET /api/books/search', () => {
  it('400 when q missing', async () => {
    const res = await GET(mockRequest('http://t/api/books/search'));
    expect(res.status).toBe(400);
  });

  it('returns merged + deduped results', async () => {
    global.fetch = jest.fn((url: any) => {
      const u = String(url);
      if (u.includes('openlibrary.org')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            docs: [
              {
                key: '/works/OL1W',
                title: 'Dune',
                author_name: ['Frank Herbert'],
                cover_i: 42,
                first_publish_year: 1965,
              },
            ],
          }),
        });
      }
      if (u.includes('googleapis.com')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [
              {
                id: 'g-1',
                volumeInfo: {
                  title: 'Dune', // duplicate, should be deduped
                  authors: ['Frank Herbert'],
                  averageRating: 4.7,
                  ratingsCount: 1000,
                  publishedDate: '1965',
                },
              },
              {
                id: 'g-2',
                volumeInfo: {
                  title: 'Foundation',
                  authors: ['Isaac Asimov'],
                  averageRating: 4.4,
                  ratingsCount: 800,
                  publishedDate: '1951',
                },
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: false });
    }) as any;

    const res = await GET(mockRequest('http://t/api/books/search?q=dune'));
    expect(res.status).toBe(200);
    const body = await res.json();
    const titles = body.books.map((b: any) => b.title);
    expect(titles.filter((t: string) => t === 'Dune')).toHaveLength(1); // deduped
    expect(body.books.length).toBeGreaterThan(0);
  });

  it('handles upstream failure gracefully (empty list)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any;
    const res = await GET(mockRequest('http://t/api/books/search?q=x'));
    expect(res.status).toBe(200);
    expect((await res.json()).books).toEqual([]);
  });
});
