import { redirect } from 'next/navigation';

interface SearchBook {
  id: string;
  title: string;
  authors: string[];
}

interface SearchApiResponse {
  books?: SearchBook[];
}

interface ResolvePageProps {
  searchParams: Promise<{
    title?: string;
    author?: string;
  }>;
}

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const getBaseUrl = () =>
  process.env.NEXTAUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

async function resolveBookId(title: string, author: string) {
  const query = `${title} ${author}`.trim();
  const response = await fetch(
    `${getBaseUrl()}/api/books/search?q=${encodeURIComponent(query)}&page=1`,
    { cache: 'no-store' }
  );

  if (!response.ok) return null;

  const data = (await response.json()) as SearchApiResponse;
  const books = Array.isArray(data.books) ? data.books : [];

  if (books.length === 0) return null;

  const normalizedTitle = normalize(title);
  const normalizedAuthor = normalize(author);

  const bestMatch = books.find(
    (book) =>
      normalize(book.title).includes(normalizedTitle) &&
      book.authors.some((bookAuthor) => normalize(bookAuthor).includes(normalizedAuthor))
  );

  if (!bestMatch) {
    return null;
  }

  return bestMatch.id;
}

export default async function ResolveBookPage({ searchParams }: ResolvePageProps) {
  const { title = '', author = '' } = await searchParams;
  const trimmedTitle = title.trim();
  const trimmedAuthor = author.trim();

  if (!trimmedTitle) {
    redirect('/search');
  }

  const resolvedId = await resolveBookId(trimmedTitle, trimmedAuthor);

  if (resolvedId) {
    redirect(`/book/${encodeURIComponent(resolvedId)}`);
  }

  const fallbackQuery = `${trimmedTitle} ${trimmedAuthor}`.trim();
  redirect(`/search?q=${encodeURIComponent(fallbackQuery)}`);
}
