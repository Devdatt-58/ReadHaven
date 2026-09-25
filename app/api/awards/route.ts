import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

interface Recommendation {
  title: string;
  author: string;
}

const GROQ_TIMEOUT_MS = 8000;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_RESULTS = 5;

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

function parseRecommendations(content: string): Recommendation[] | null {
  const cleaned = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return null;

  const recommendations: Recommendation[] = [];
  for (const entry of parsed) {
    if (
      entry &&
      typeof entry === 'object' &&
      typeof (entry as { title?: unknown }).title === 'string' &&
      typeof (entry as { author?: unknown }).author === 'string'
    ) {
      recommendations.push({
        title: (entry as Recommendation).title,
        author: (entry as Recommendation).author,
      });
    }
  }

  return recommendations.length > 0 ? recommendations : null;
}

async function askGroq(category: string, apiKey: string): Promise<string | null> {
  const prompt = `You are a book recommendation expert. For the category "${category}", provide exactly 5 specific, real book titles.

Respond ONLY with a JSON array, no surrounding text:
[
  {"title": "Book Title", "author": "Author Name"}
]`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are a book expert. Respond only with JSON arrays.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', await response.text());
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content : null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchBookFromSearch(rec: Recommendation, baseUrl: string) {
  const searchUrl = new URL('/api/books/search', baseUrl);
  searchUrl.searchParams.set('q', `${rec.title} ${rec.author}`);
  searchUrl.searchParams.set('page', '1');

  const searchResponse = await fetch(searchUrl, { cache: 'no-store' });
  if (!searchResponse.ok) return null;

  const searchData = await searchResponse.json();
  const first = searchData?.books?.[0];
  if (!first) return null;

  const detailUrl = new URL(`/api/books/${first.id}`, baseUrl);
  const detailResponse = await fetch(detailUrl, { cache: 'no-store' });

  if (!detailResponse.ok) {
    return {
      ...first,
      description: first.description || 'A highly recommended book.',
      thumbnail: first.thumbnail || '/images/no-cover.svg',
    };
  }

  const full = await detailResponse.json();
  return {
    id: full.id,
    title: full.title || first.title,
    authors: full.authors?.length ? full.authors : first.authors || ['Unknown Author'],
    thumbnail:
      full.coverImage || full.thumbnail || first.thumbnail || '/images/no-cover.svg',
    averageRating: full.averageRating || first.averageRating || 0,
    ratingsCount: full.ratingsCount || first.ratingsCount || 0,
    description: full.description || first.description || 'A highly recommended book.',
    publishedDate: full.publishedDate || first.publishedDate || '',
  };
}

async function fillFromCategorySearch(
  category: string,
  baseUrl: string,
  existing: { id: string }[]
) {
  const fallbackQuery = category.replace(/best\s+/i, '').replace(/\d{4}/g, '').trim();
  const url = new URL('/api/books/search', baseUrl);
  url.searchParams.set('q', fallbackQuery);
  url.searchParams.set('page', '1');

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) return [];

  const data = await response.json();
  if (!Array.isArray(data?.books)) return [];

  const seen = new Set(existing.map((b) => b.id));
  const extras: unknown[] = [];
  for (const book of data.books) {
    if (extras.length + existing.length >= MAX_RESULTS) break;
    if (seen.has(book.id)) continue;
    extras.push({
      ...book,
      description: book.description || 'A highly recommended book.',
      thumbnail: book.thumbnail || '/images/no-cover.svg',
    });
  }
  return extras;
}

export async function POST(request: Request) {
  try {
    // This endpoint calls the paid Groq API, so cap how often a client can hit it.
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const limited = rateLimit(`awards:${ip}`, 10, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
      );
    }

    const body = await request.json().catch(() => null);
    const category =
      body && typeof (body as { category?: unknown }).category === 'string'
        ? (body as { category: string }).category
        : '';

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Recommendations service not configured' },
        { status: 503 }
      );
    }

    let rawContent: string | null;
    try {
      rawContent = await askGroq(category, apiKey);
    } catch (error) {
      if (isAbortError(error)) {
        return NextResponse.json(
          { error: `Recommendation request timed out after ${GROQ_TIMEOUT_MS}ms` },
          { status: 504 }
        );
      }
      throw error;
    }

    if (!rawContent) {
      return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 502 });
    }

    const recommendations = parseRecommendations(rawContent);
    if (!recommendations) {
      return NextResponse.json({ error: 'Invalid recommendation format' }, { status: 502 });
    }

    const baseUrl = new URL(request.url).origin;
    const results = await Promise.all(
      recommendations.map((rec) =>
        fetchBookFromSearch(rec, baseUrl).catch((err) => {
          console.error('Book lookup failed:', err);
          return null;
        })
      )
    );
    const books = results.filter((b): b is NonNullable<typeof b> => b !== null);

    if (books.length < 3) {
      const extras = await fillFromCategorySearch(category, baseUrl, books);
      for (const extra of extras) {
        books.push(extra as (typeof books)[number]);
      }
    }

    return NextResponse.json({ books: books.slice(0, MAX_RESULTS) });
  } catch (error) {
    console.error('Awards API error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
