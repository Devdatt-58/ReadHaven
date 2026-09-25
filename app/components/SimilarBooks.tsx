'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string | null;
  distance: number;
}

interface Props {
  query: string;
  heading?: string;
  limit?: number;
  excludeTitle?: string;
}

const buildResolveHref = (title: string, author: string) =>
  `/book/resolve?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`;

export default function SimilarBooks({
  query,
  heading = 'More like this',
  limit = 6,
  excludeTitle,
}: Props) {
  const trimmed = query.trim();
  const [books, setBooks] = useState<RecommendedBook[]>([]);
  const [loading, setLoading] = useState(Boolean(trimmed));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (q: string, signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/recommendations?q=${encodeURIComponent(q)}&limit=${limit}`,
          { signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (signal.aborted) return;
        setBooks(Array.isArray(data.books) ? data.books : []);
      } catch (err) {
        if (signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load';
        setError(message);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    if (!trimmed) return;
    const controller = new AbortController();
    void load(trimmed, controller.signal);
    return () => controller.abort();
  }, [trimmed, load]);

  // The query for a book detail page includes that book's own title, so it can
  // come back as its own closest match — drop it from the results.
  const visibleBooks = excludeTitle
    ? books.filter(
        (book) =>
          book.title.trim().toLowerCase() !== excludeTitle.trim().toLowerCase()
      )
    : books;

  if (!trimmed) return null;
  if (loading) {
    return (
      <section className="similar-books-section">
        <h3>{heading}</h3>
        <p className="similar-books-status">Finding similar books…</p>
      </section>
    );
  }
  if (error) {
    return (
      <section className="similar-books-section">
        <h3>{heading}</h3>
        <p className="similar-books-status">Couldn&apos;t load recommendations.</p>
      </section>
    );
  }
  if (visibleBooks.length === 0) return null;

  return (
    <section className="similar-books-section">
      <h3>{heading}</h3>
      <div className="similar-books-row">
        {visibleBooks.map((book) => (
          <Link
            key={book.id}
            href={buildResolveHref(book.title, book.author)}
            className="similar-book-card"
            aria-label={`${book.title} by ${book.author}`}
          >
            <div className="similar-book-cover">
              <img
                src={book.coverUrl || '/images/no-cover.svg'}
                alt={book.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/no-cover.svg';
                }}
              />
            </div>
            <div className="similar-book-meta">
              <p className="similar-book-title">{book.title}</p>
              <p className="similar-book-author">{book.author}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
