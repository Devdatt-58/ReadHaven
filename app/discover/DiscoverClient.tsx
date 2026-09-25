'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MobileTopBar from '../components/MobileTopBar';
import { primaryMobileNavItems } from '../components/mobile-nav';

interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string | null;
  distance: number;
}

const SUGGESTIONS = [
  'cozy mystery in a small town',
  'sweeping space opera with politics',
  'memoir about grief',
  'beginner-friendly philosophy',
  'historical fiction set in Tokyo',
  'morally ambiguous heist',
];

const buildResolveHref = (title: string, author: string) =>
  `/book/resolve?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`;

export default function DiscoverClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [input, setInput] = useState(initialQuery);
  const [books, setBooks] = useState<RecommendedBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery));

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/recommendations?q=${encodeURIComponent(q)}&limit=20`
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setBooks(Array.isArray(data.books) ? data.books : []);
    } catch {
      setError('Something went wrong. Please try again.');
      setBooks([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, []);

  useEffect(() => {
    setInput(initialQuery);
    if (initialQuery) {
      void runSearch(initialQuery);
    } else {
      setBooks([]);
      setHasSearched(false);
    }
  }, [initialQuery, runSearch]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    router.push(`/discover?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSuggestion = (s: string) => {
    setInput(s);
    router.push(`/discover?q=${encodeURIComponent(s)}`);
  };

  return (
    <div className="discover-page">
      <MobileTopBar title="Discover" navItems={primaryMobileNavItems} />

      <h1>Discover</h1>
      <p className="discover-sub">
        Describe the kind of book you&apos;re in the mood for. Search runs over the
        local catalogue with cosine similarity on sentence embeddings.
      </p>

      <form className="discover-search" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="e.g. cozy mystery in a small town"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {!hasSearched && (
        <div className="discover-suggestions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="discover-suggestion-pill"
              onClick={() => handleSuggestion(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="discover-empty">{error}</p>}

      {hasSearched && !loading && !error && books.length === 0 && (
        <p className="discover-empty">
          No matches. Try a different phrasing, or check if the catalogue has been seeded.
        </p>
      )}

      {books.length > 0 && (
        <div className="discover-results">
          {books.map((book) => (
            <Link
              key={book.id}
              href={buildResolveHref(book.title, book.author)}
              className="discover-card"
            >
              <div className="discover-card-cover">
                <img
                  src={book.coverUrl || '/images/no-cover.jpg'}
                  alt={book.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/no-cover.jpg';
                  }}
                />
              </div>
              <div className="discover-card-meta">
                <p className="discover-card-title">{book.title}</p>
                <p className="discover-card-author">{book.author}</p>
                <p className="discover-card-distance">
                  similarity {(1 - book.distance).toFixed(3)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
