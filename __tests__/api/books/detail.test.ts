import { GET } from '@/app/api/books/[id]/route';
import { mockRequest } from '../../helpers';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/books/[id]', () => {
  it('returns merged book from Google id', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'g1',
        volumeInfo: {
          title: 'Title',
          authors: ['A'],
          description: '<p>Hello &amp; <script>x</script>world</p>',
          imageLinks: { thumbnail: 't.jpg' },
        },
      }),
    }) as any;

    const res = await GET(mockRequest('http://t/api/books/g1'), ctx('g1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Title');
    expect(body.description).not.toContain('<script>');
    expect(body.description).toContain('&');
  });

  it('falls back to Open Library when google fails', async () => {
    global.fetch = jest.fn((url: any) => {
      const u = String(url);
      if (u.includes('googleapis.com')) {
        return Promise.resolve({ ok: false });
      }
      if (u.includes('/works/') && u.endsWith('.json')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            title: 'OL Title',
            description: 'plain string',
            covers: [123],
            authors: [],
            subjects: ['fiction', 'classic'],
          }),
        });
      }
      // editions / ratings calls -- return failure to short-circuit them
      return Promise.resolve({ ok: false });
    }) as any;

    const res = await GET(mockRequest('http://t/api/books/OL1W'), ctx('OL1W'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('OL Title');
  });

  it('500 when both sources fail', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any;
    const res = await GET(mockRequest('http://t/api/books/xyz'), ctx('xyz'));
    expect(res.status).toBe(500);
  });

  it('returns OL-only book and decodes numeric entities', async () => {
    global.fetch = jest.fn((url: any) => {
      const u = String(url);
      if (u.includes('googleapis.com')) return Promise.resolve({ ok: false });
      if (u.endsWith('/works/OL2W.json')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            title: 'Entity',
            description: { value: 'Caf&#233; &#x263A;' },
            authors: [{ author: { key: '/authors/OLA' } }],
            covers: [9],
            subjects: ['a', 'b'],
          }),
        });
      }
      if (u.includes('/authors/OLA.json')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ name: 'Author Name' }),
        });
      }
      if (u.includes('/editions.json')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            entries: [
              {
                publish_date: '2020',
                publishers: ['Pub'],
                number_of_pages: 200,
                isbn_13: ['9780000000001'],
              },
            ],
          }),
        });
      }
      if (u.includes('/ratings.json')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ summary: { average: 4.2, count: 50 } }),
        });
      }
      return Promise.resolve({ ok: false });
    }) as any;

    const res = await GET(mockRequest('http://t/api/books/OL2W'), ctx('OL2W'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authors).toContain('Author Name');
    expect(body.description).toContain('Café');
    expect(body.isbn).toBe('9780000000001');
    expect(body.averageRating).toBe(4.2);
  });
});
