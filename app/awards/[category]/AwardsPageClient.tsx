'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import MobileTopBar from '../../components/MobileTopBar';
import { primaryMobileNavItems } from '../../components/mobile-nav';

interface Book {
  id: string;
  title: string;
  authors: string[];
  thumbnail: string;
  averageRating: number;
  ratingsCount: number;
  description: string;
  publishedDate: string;
}

interface Props {
  category: string;
}

export default function AwardsPageClient({ category }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAwardBooks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/awards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }

      const data = await response.json();
      setBooks(data.books || []);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load books. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchAwardBooks();
  }, [category, fetchAwardBooks]);

  const getDescriptionPreview = (description: string) => {
    if (!description || description === 'No description available') {
      return 'A highly recommended book in this category.';
    }
    
    // Remove HTML tags
    const cleanDescription = description.replace(/<[^>]*>/g, '');
    
    // Return first 250 characters
    if (cleanDescription.length > 250) {
      return cleanDescription.substring(0, 250) + '...';
    }
    return cleanDescription;
  };

  const formatPublishedYear = (publishedDate: string) => {
    if (!publishedDate) return '';
    const timestamp = Date.parse(publishedDate);
    if (Number.isNaN(timestamp)) return publishedDate;
    const year = new Date(timestamp).getFullYear();
    return Number.isNaN(year) ? publishedDate : String(year);
  };

  return (
    <div className="awards-page">
      <MobileTopBar title="Awards" backHref="/" navItems={primaryMobileNavItems} />
      <div className="awards-page-header mobile-page-heading">
        <Link href="/" className="back-home">
          ← Back to Home
        </Link>
        <h1>{category}</h1>
        <p className="awards-subtitle">The best books curated for you</p>
      </div>

      <div className="awards-page-container">
        {loading && (
          <div className="awards-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Finding the best books for you...</p>
          </div>
        )}

        {error && (
          <div className="awards-error">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
            <button type="button" onClick={fetchAwardBooks} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && books.length > 0 && (
          <div className="awards-books-list">
            {books.map((book, index) => (
              <Link 
                key={book.id} 
                href={`/book/${book.id}`}
                className="awards-book-item"
              >
                <div className="awards-rank">#{index + 1}</div>
                
                <div className="awards-book-cover">
                  <img
                    src={book.thumbnail || '/images/no-cover.jpg'}
                    alt={book.title}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/images/no-cover.jpg') {
                        target.src = '/images/no-cover.jpg';
                      }
                    }}
                  />
                </div>

                <div className="awards-book-details">
                  <h2>{book.title}</h2>
                  <p className="awards-authors">by {book.authors.join(', ')}</p>

                  {book.averageRating > 0 && (
                    <div className="awards-rating">
                      <div className="stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`fas fa-star ${
                              star <= Math.round(book.averageRating) ? 'filled' : ''
                            }`}
                          />
                        ))}
                      </div>
                      <span className="rating-text">
                        {book.averageRating.toFixed(1)} ({book.ratingsCount} ratings)
                      </span>
                    </div>
                  )}

                  <p className="awards-description">
                    {getDescriptionPreview(book.description)}
                  </p>

                  {book.publishedDate && (
                    <p className="awards-published">
                      Published: {formatPublishedYear(book.publishedDate)}
                    </p>
                  )}

                  <div className="awards-view-link">
                    View Book Details →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && books.length === 0 && (
          <div className="awards-empty">
            <i className="fas fa-book"></i>
            <h3>No books found</h3>
            <p>We couldn&apos;t find any books for this category.</p>
            <Link href="/" className="back-btn">
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
