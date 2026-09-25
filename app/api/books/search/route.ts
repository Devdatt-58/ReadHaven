import { NextResponse } from 'next/server';
import { parseBoundedInt } from '@/lib/validation';

// Search results change slowly; cache the upstream responses for an hour.
const UPSTREAM_REVALIDATE = 60 * 60;

interface OpenLibrarySearchResult {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  isbn?: string[];
  ratings_average?: number;
  ratings_count?: number;
  subject?: string[];
}

interface GoogleBookVolumeResult {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    imageLinks?: {
      thumbnail?: string;
    };
    averageRating?: number;
    ratingsCount?: number;
    categories?: string[];
    industryIdentifiers?: { identifier?: string }[];
  };
}

async function searchOpenLibrary(query: string, offset: number, limit: number) {
  const response = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(
      query
    )}&offset=${offset}&limit=${limit}&fields=key,title,author_name,first_publish_year,cover_i,isbn,ratings_average,ratings_count,subject`,
    { next: { revalidate: UPSTREAM_REVALIDATE } }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const docs: OpenLibrarySearchResult[] = Array.isArray(data?.docs)
    ? data.docs
    : [];

  return docs.map((item) => ({
    id: item.key?.replace('/works/', '') || `ol-${Date.now()}`,
    title: item.title || 'Unknown Title',
    authors: item.author_name || ['Unknown Author'],
    publishedDate: item.first_publish_year?.toString() || '',
    thumbnail: item.cover_i
      ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`
      : '/images/no-cover.svg',
    averageRating: item.ratings_average || 0,
    ratingsCount: item.ratings_count || 0,
    categories: item.subject?.slice(0, 3) || [],
    isbn: item.isbn?.[0] || '',
    source: 'openlibrary',
  }));
}

async function searchGoogleBooks(query: string, startIndex: number, maxResults: number) {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      query
    )}&startIndex=${startIndex}&maxResults=${maxResults}`,
    { next: { revalidate: UPSTREAM_REVALIDATE } }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const items: GoogleBookVolumeResult[] = Array.isArray(data?.items)
    ? data.items
    : [];

  return items.map((item) => ({
    id: item.id,
    title: item.volumeInfo?.title || 'Unknown Title',
    authors: item.volumeInfo?.authors || ['Unknown Author'],
    publishedDate: item.volumeInfo?.publishedDate || '',
    thumbnail: item.volumeInfo?.imageLinks?.thumbnail || '/images/no-cover.svg',
    averageRating: item.volumeInfo?.averageRating || 0,
    ratingsCount: item.volumeInfo?.ratingsCount || 0,
    categories: item.volumeInfo?.categories || [],
    isbn: item.volumeInfo?.industryIdentifiers?.[0]?.identifier || '',
    source: 'google',
  }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const page = parseBoundedInt(searchParams.get('page'), {
      defaultValue: 1,
      min: 1,
      max: 1000,
    });
    const limit = 20;
    const offset = (page - 1) * limit;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const [openLibraryBooks, googleBooks] = await Promise.all([
      searchOpenLibrary(query, offset, limit),
      searchGoogleBooks(query, offset, limit),
    ]);

    const allBooks = [...(openLibraryBooks || []), ...(googleBooks || [])];

    const uniqueBooks = allBooks.filter((book, index, self) => {
      return index === self.findIndex((b) =>
        b.title.toLowerCase() === book.title.toLowerCase() &&
        b.authors[0]?.toLowerCase() === book.authors[0]?.toLowerCase()
      );
    });

    const sortedBooks = uniqueBooks.sort((a, b) => {
      if (a.ratingsCount > 0 && b.ratingsCount === 0) return -1;
      if (b.ratingsCount > 0 && a.ratingsCount === 0) return 1;
      if (a.averageRating !== b.averageRating) {
        return b.averageRating - a.averageRating;
      }
      return (b.publishedDate || '0') > (a.publishedDate || '0') ? 1 : -1;
    });

    return NextResponse.json({
      books: sortedBooks.slice(0, limit),
      totalItems: uniqueBooks.length,
      currentPage: page,
      hasMore: uniqueBooks.length > limit,
    });
  } catch (error) {
    console.error('Book search error:', error);
    return NextResponse.json(
      { error: 'Failed to search books' },
      { status: 500 }
    );
  }
}
