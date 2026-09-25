'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MobileTopBar from '../components/MobileTopBar';
import { getAccountNavItems, primaryMobileNavItems } from '../components/mobile-nav';

interface Review {
  id: string;
  bookId: string;
  rating: number;
  content: string | null;
  createdAt: Date;
}

interface BookData {
  [bookId: string]: {
    title: string;
    authors: string[];
    thumbnail: string;
  };
}

interface Props {
  reviews: Review[];
}

export default function ReviewsPageClient({ reviews }: Props) {
  const router = useRouter();
  const [bookData, setBookData] = useState<BookData>({});
  const [loading, setLoading] = useState(() => reviews.length > 0);
  const accountItems = getAccountNavItems(true);

  useEffect(() => {
    let isCancelled = false;

    if (reviews.length === 0) {
      queueMicrotask(() => {
        if (isCancelled) {
          return;
        }

        setBookData({});
        setLoading(false);
      });

      return () => {
        isCancelled = true;
      };
    }

    async function fetchBookData() {
      if (!isCancelled) {
        setLoading(true);
      }

      const uniqueBookIds = [...new Set(reviews.map((review) => review.bookId))];
      const results = await Promise.all(
        uniqueBookIds.map(async (bookId) => {
          try {
            const response = await fetch(`/api/books/${bookId}`);
            if (!response.ok) {
              return null;
            }

            const book = await response.json();
            return {
              bookId,
              data: {
                title: book.title,
                authors: book.authors,
                thumbnail: book.thumbnail,
              },
            };
          } catch (error) {
            console.error('Error fetching book:', error);
            return null;
          }
        })
      );

      if (isCancelled) {
        return;
      }

      const data: BookData = {};
      for (const result of results) {
        if (!result) continue;
        data[result.bookId] = result.data;
      }

      setBookData(data);
      setLoading(false);
    }

    fetchBookData();

    return () => {
      isCancelled = true;
    };
  }, [reviews]);

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review?')) return;

    try {
      const response = await fetch('/api/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  return (
    <div className="reviews-page">
      <MobileTopBar
        title="My Reviews"
        backHref="/"
        showProfileTrigger
        navItems={primaryMobileNavItems}
        profileItems={accountItems}
      />
      <div className="reviews-header mobile-page-heading">
        <Link href="/" className="back-home">
          ← Back to Home
        </Link>
        <div className="reviews-title-section">
          <h1>My Reviews</h1>
          <p className="reviews-count">{reviews.length} reviews</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i> Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="empty-reviews">
          <i className="fas fa-star"></i>
          <h3>You haven&apos;t reviewed any books yet</h3>
          <p>Start reading and share your thoughts!</p>
          <Link href="/search" className="browse-books-btn">
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => {
            const book = bookData[review.bookId];
            const title = book?.title || 'Book details unavailable';
            const authors = book?.authors?.length
              ? book.authors.join(', ')
              : 'Unknown author';
            const thumbnail = book?.thumbnail || '/images/no-cover.svg';

            return (
              <div key={review.id} className="review-card">
                <Link href={`/book/${review.bookId}`} className="review-book-cover">
                  <img
                    src={thumbnail}
                    alt={title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/no-cover.svg';
                    }}
                  />
                </Link>

                <div className="review-content">
                  <Link href={`/book/${review.bookId}`} className="review-book-title">
                    {title}
                  </Link>
                  <p className="review-book-authors">
                    by {authors}
                  </p>

                  <div className="review-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`fas fa-star ${
                          star <= review.rating ? 'filled' : ''
                        }`}
                      ></i>
                    ))}
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {review.content && (
                    <p className="review-text">{review.content}</p>
                  )}

                  <div className="review-actions">
                    <Link href={`/book/${review.bookId}`} className="edit-review-btn">
                      <i className="fas fa-edit"></i> Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="delete-review-btn"
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
