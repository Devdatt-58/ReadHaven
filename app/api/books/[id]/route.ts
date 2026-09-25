import { NextResponse } from 'next/server';

interface Book {
  id: string;
  title: string;
  subtitle: string;
  authors: string[];
  description: string;
  publishedDate: string;
  publisher: string;
  pageCount: number;
  categories: string[];
  averageRating: number;
  ratingsCount: number;
  thumbnail: string;
  coverImage: string;
  language: string;
  isbn: string;
  previewLink: string;
  infoLink: string;
  source?: 'google' | 'openlibrary';
}

// Book metadata rarely changes, so upstream responses are cached for a day.
const UPSTREAM_REVALIDATE = 60 * 60 * 24;

function decodeHtmlEntities(value: string) {
  return value.replace(
    /&(#x?[0-9a-fA-F]+|amp|quot|apos|lt|gt|nbsp);/g,
    (match, entity: string) => {
      const normalized = entity.toLowerCase();
      if (normalized === 'amp') return '&';
      if (normalized === 'quot') return '"';
      if (normalized === 'apos') return "'";
      if (normalized === 'lt') return '<';
      if (normalized === 'gt') return '>';
      if (normalized === 'nbsp') return ' ';

      if (normalized.startsWith('#x')) {
        const codePoint = Number.parseInt(normalized.slice(2), 16);
        return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
      }

      if (normalized.startsWith('#')) {
        const codePoint = Number.parseInt(normalized.slice(1), 10);
        return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
      }

      return match;
    }
  );
}

function sanitizeDescription(rawDescription: unknown) {
  const description =
    typeof rawDescription === 'string' ? rawDescription : '';

  if (!description) {
    return '';
  }

  const decodedDescription = decodeHtmlEntities(description);

  return decodedDescription
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, ' ')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, ' ')
    .replace(/<embed[\s\S]*?>[\s\S]*?<\/embed>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchFromGoogle(id: string): Promise<Book | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes/${id}`,
      { next: { revalidate: UPSTREAM_REVALIDATE } }
    );

    if (!response.ok) return null;

    const item = await response.json();

    return {
      id: item.id,
      title: item.volumeInfo?.title || '',
      subtitle: item.volumeInfo?.subtitle || '',
      authors: item.volumeInfo?.authors || [],
      description: sanitizeDescription(item.volumeInfo?.description),
      publishedDate: item.volumeInfo?.publishedDate || '',
      publisher: item.volumeInfo?.publisher || '',
      pageCount: item.volumeInfo?.pageCount || 0,
      categories: item.volumeInfo?.categories || [],
      averageRating: item.volumeInfo?.averageRating || 0,
      ratingsCount: item.volumeInfo?.ratingsCount || 0,
      thumbnail: item.volumeInfo?.imageLinks?.thumbnail ||
                 item.volumeInfo?.imageLinks?.smallThumbnail || '',
      coverImage: item.volumeInfo?.imageLinks?.large ||
                  item.volumeInfo?.imageLinks?.medium ||
                  item.volumeInfo?.imageLinks?.thumbnail || '',
      language: item.volumeInfo?.language || 'en',
      isbn: item.volumeInfo?.industryIdentifiers?.[0]?.identifier || '',
      previewLink: item.volumeInfo?.previewLink || '',
      infoLink: item.volumeInfo?.infoLink || '',
      source: 'google',
    };
  } catch {
    return null;
  }
}

async function fetchFromOpenLibrary(id: string): Promise<Book | null> {
  try {
    const workResponse = await fetch(`https://openlibrary.org/works/${id}.json`, {
      next: { revalidate: UPSTREAM_REVALIDATE },
    });
    if (!workResponse.ok) return null;

    const work = await workResponse.json();

    let description = '';
    if (work.description) {
      description = sanitizeDescription(
        typeof work.description === 'string'
          ? work.description
          : work.description.value || ''
      );
    }

    const authorNames: string[] = [];
    if (Array.isArray(work.authors)) {
      for (const authorRef of work.authors.slice(0, 3)) {
        try {
          const authorKey = authorRef.author?.key || authorRef.key;
          if (!authorKey) continue;
          const authorResponse = await fetch(
            `https://openlibrary.org${authorKey}.json`,
            { next: { revalidate: UPSTREAM_REVALIDATE } }
          );
          if (authorResponse.ok) {
            const author = await authorResponse.json();
            if (author?.name) authorNames.push(author.name);
          }
        } catch {
          continue;
        }
      }
    }

    const coverId = work.covers?.[0];
    const coverImage = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : '';

    let publishedDate = '';
    let publisher = '';
    let pageCount = 0;
    let isbn = '';

    try {
      const editionsResponse = await fetch(
        `https://openlibrary.org/works/${id}/editions.json?limit=1`,
        { next: { revalidate: UPSTREAM_REVALIDATE } }
      );
      if (editionsResponse.ok) {
        const editionsData = await editionsResponse.json();
        const firstEdition = editionsData.entries?.[0];
        if (firstEdition) {
          publishedDate = firstEdition.publish_date || '';
          publisher = firstEdition.publishers?.[0] || '';
          pageCount = firstEdition.number_of_pages || 0;
          isbn = firstEdition.isbn_13?.[0] || firstEdition.isbn_10?.[0] || '';
        }
      }
    } catch {
      // Editions metadata is optional.
    }

    let averageRating = 0;
    let ratingsCount = 0;
    try {
      const ratingsResponse = await fetch(
        `https://openlibrary.org/works/${id}/ratings.json`,
        { next: { revalidate: UPSTREAM_REVALIDATE } }
      );
      if (ratingsResponse.ok) {
        const ratings = await ratingsResponse.json();
        averageRating = ratings.summary?.average || 0;
        ratingsCount = ratings.summary?.count || 0;
      }
    } catch {
      // Ratings metadata is optional.
    }

    return {
      id,
      title: work.title || '',
      subtitle: work.subtitle || '',
      authors: authorNames.length > 0 ? authorNames : [],
      description,
      publishedDate,
      publisher,
      pageCount,
      categories: work.subjects?.slice(0, 5) || [],
      averageRating,
      ratingsCount,
      thumbnail: coverImage,
      coverImage,
      language: 'en',
      isbn,
      previewLink: `https://openlibrary.org/works/${id}`,
      infoLink: `https://openlibrary.org/works/${id}`,
      source: 'openlibrary',
    };
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Google volume IDs are short and never start with "OL"; Open Library
    // work IDs look like "OL12345W".
    const isGoogleId = id.length < 20 && !id.startsWith('OL');

    let googleData: Book | null = null;
    let openLibraryData: Book | null = null;

    if (isGoogleId) {
      googleData = await fetchFromGoogle(id);
      if (!googleData) {
        openLibraryData = await fetchFromOpenLibrary(id);
      }
    } else {
      openLibraryData = await fetchFromOpenLibrary(id);
      if (!openLibraryData) {
        googleData = await fetchFromGoogle(id);
      }
    }

    let book: Book | undefined;

    if (googleData && openLibraryData) {
      book = {
        id,
        title: googleData.title || openLibraryData.title || 'Unknown Title',
        subtitle: googleData.subtitle || openLibraryData.subtitle || '',
        authors: googleData.authors.length > 0 ? googleData.authors : openLibraryData.authors || ['Unknown Author'],
        description: googleData.description || openLibraryData.description || 'No description available',
        publishedDate: googleData.publishedDate || openLibraryData.publishedDate || '',
        publisher: googleData.publisher || openLibraryData.publisher || '',
        pageCount: googleData.pageCount || openLibraryData.pageCount || 0,
        categories: googleData.categories.length > 0 ? googleData.categories : openLibraryData.categories || [],
        averageRating: googleData.averageRating || openLibraryData.averageRating || 0,
        ratingsCount: googleData.ratingsCount || openLibraryData.ratingsCount || 0,
        // Open Library covers tend to be higher resolution.
        thumbnail: openLibraryData.thumbnail || googleData.thumbnail || '/images/no-cover.svg',
        coverImage: openLibraryData.coverImage || googleData.coverImage || '/images/no-cover.svg',
        language: googleData.language || openLibraryData.language || 'en',
        isbn: googleData.isbn || openLibraryData.isbn || '',
        previewLink: googleData.previewLink || openLibraryData.previewLink || '',
        infoLink: googleData.infoLink || openLibraryData.infoLink || '',
      };
    } else if (googleData) {
      book = {
        ...googleData,
        source: undefined,
        title: googleData.title || 'Unknown Title',
        authors: googleData.authors.length > 0 ? googleData.authors : ['Unknown Author'],
        description: googleData.description || 'No description available',
        thumbnail: googleData.thumbnail || '/images/no-cover.svg',
        coverImage: googleData.coverImage || '/images/no-cover.svg',
      };
    } else if (openLibraryData) {
      book = {
        ...openLibraryData,
        source: undefined,
        title: openLibraryData.title || 'Unknown Title',
        authors: openLibraryData.authors.length > 0 ? openLibraryData.authors : ['Unknown Author'],
        description: openLibraryData.description || 'No description available',
        thumbnail: openLibraryData.thumbnail || '/images/no-cover.svg',
        coverImage: openLibraryData.coverImage || '/images/no-cover.svg',
      };
    } else {
      throw new Error('Book not found in any source');
    }

    if (!book) {
      throw new Error('Book transformation failed');
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('Book detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book details' },
      { status: 500 }
    );
  }
}
