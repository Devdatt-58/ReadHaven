'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Session } from 'next-auth';
import MobileTopBar from '../../components/MobileTopBar';
import SimilarBooks from '../../components/SimilarBooks';
import { getAccountNavItems, primaryMobileNavItems } from '../../components/mobile-nav';

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  description: string;
  coverImage: string;
  publishedDate: string;
  publisher: string;
  pageCount: number;
  categories: string[];
  averageRating: number;
  ratingsCount: number;
  isbn: string;
  language: string;
}

interface Shelf {
  id: string;
  name: string;
}

interface Review {
  id: string;
  rating: number;
  content: string | null;
}

interface BookReview {
  id: string;
  rating: number;
  content: string | null;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Props {
  book: Book;
  session: Session | null;
  userShelves: Shelf[];
  userReview: Review | null;
  bookReviews: BookReview[];
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

function formatDate(dateValue: string | Date) {
  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Unknown';
  }

  return DATE_FORMATTER.format(parsedDate);
}

function StarRating({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`fas fa-star ${star <= rating ? 'filled' : ''}`}
        ></i>
      ))}
    </div>
  );
}

export default function BookDetailClient({
  book,
  session,
  userShelves,
  userReview: initialReview,
  bookReviews,
}: Props) {
  const router = useRouter();
  const [showShelfDropdown, setShowShelfDropdown] = useState(false);
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [reviewText, setReviewText] = useState(initialReview?.content || '');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const accountItems = getAccountNavItems(Boolean(session?.user?.id));

  const handleAddToShelf = async (shelfId: string) => {
    if (!session) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/shelves/add-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shelfId,
          bookId: book.id,
          bookData: {
            title: book.title,
            authors: book.authors,
            thumbnail: book.coverImage,
          },
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error || 'Failed to add book to shelf');
        return;
      }

      alert(result?.message || 'Book added to shelf!');
      setShowShelfDropdown(false);
      router.refresh();
    } catch (error) {
      console.error('Error adding to shelf:', error);
      alert('Failed to add book to shelf');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push('/login');
      return;
    }

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          rating,
          content: reviewText,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error || 'Failed to submit review');
        return;
      }

      alert('Review submitted!');
      setShowReviewForm(false);
      router.refresh();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-detail-page">
      <MobileTopBar
        title={book.title}
        backHref="/search"
        showProfileTrigger={Boolean(session?.user?.id)}
        navItems={primaryMobileNavItems}
        profileItems={accountItems}
      />
      <div className="book-detail-header mobile-page-heading">
        <Link href="/search" className="back-link">
          ← Back to Search
        </Link>
      </div>

      <div className="book-detail-container">
        <div className="book-detail-main">
          <div className="book-cover-large">
            <img
              src={book.coverImage}
              alt={book.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/no-cover.svg';
              }}
            />
          </div>

          <div className="book-main-info">
            <h1 className="book-detail-title">{book.title}</h1>
            {book.subtitle && (
              <h2 className="book-subtitle">{book.subtitle}</h2>
            )}

            <p className="book-detail-authors">
              by {book.authors.join(', ')}
            </p>

            {book.averageRating > 0 && (
              <div className="book-detail-rating">
                <div className="stars-large">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      className={`fas fa-star ${
                        star <= book.averageRating ? 'filled' : ''
                      }`}
                    ></i>
                  ))}
                </div>
                <span className="rating-text-large">
                  {book.averageRating.toFixed(1)} ({book.ratingsCount} ratings)
                </span>
              </div>
            )}

            <div className="book-actions">
              {session ? (
                <>
                  <div className="shelf-dropdown-container">
                    <button
                      onClick={() => setShowShelfDropdown(!showShelfDropdown)}
                      className="add-to-shelf-btn"
                      disabled={loading}
                    >
                      <i className="fas fa-bookmark"></i>
                      Add to Shelf
                    </button>
                    {showShelfDropdown && (
                      <div className="shelf-dropdown">
                        {userShelves.length === 0 ? (
                          <p className="shelf-option-empty">No shelves available yet.</p>
                        ) : (
                          userShelves.map((shelf) => (
                            <button
                              type="button"
                              key={shelf.id}
                              onClick={() => handleAddToShelf(shelf.id)}
                              className="shelf-option"
                            >
                              {shelf.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="review-btn"
                  >
                    <i className="fas fa-star"></i>
                    {initialReview ? 'Edit Review' : 'Write Review'}
                  </button>
                </>
              ) : (
                <Link href="/login" className="login-prompt-btn">
                  Sign in to add to shelf
                </Link>
              )}
            </div>

            {showReviewForm && session && (
              <form onSubmit={handleSubmitReview} className="review-form">
                <h3>Your Review</h3>
                <div className="rating-input">
                  <label>Rating:</label>
                  <div className="star-rating-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`fas fa-star ${
                          star <= rating ? 'filled' : ''
                        }`}
                        onClick={() => setRating(star)}
                      ></i>
                    ))}
                  </div>
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write your review here (optional)..."
                  className="review-textarea"
                  rows={5}
                />
                <div className="review-actions">
                  <button type="submit" disabled={loading} className="submit-review-btn">
                    {loading ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <section className="book-reviews-section">
              <h3>
                Reviews
                <span className="book-reviews-count">({bookReviews.length})</span>
              </h3>

              {bookReviews.length === 0 ? (
                <p className="book-reviews-empty">
                  No reviews yet. Be the first to share one.
                </p>
              ) : (
                <div className="book-reviews-list">
                  {bookReviews.map((review) => {
                    const reviewAuthor =
                      session?.user?.id === review.user.id
                        ? 'You'
                        : review.user.name || 'Anonymous Reader';

                    return (
                      <article key={review.id} className="book-review-item">
                        <div className="book-review-header">
                          <span className="book-review-author">{reviewAuthor}</span>
                          <span className="book-review-date">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>

                        <StarRating rating={review.rating} className="book-review-stars" />

                        {review.content && (
                          <p className="book-review-content">{review.content}</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="book-detail-sidebar">
          <div className="book-meta">
            <h3>Book Details</h3>
            <div className="meta-item">
              <strong>Publisher:</strong>
              <span>{book.publisher || 'Unknown'}</span>
            </div>
            <div className="meta-item">
              <strong>Published:</strong>
              <span>
                {book.publishedDate
                  ? formatDate(book.publishedDate)
                  : 'Unknown'}
              </span>
            </div>
            <div className="meta-item">
              <strong>Pages:</strong>
              <span>{book.pageCount || 'Unknown'}</span>
            </div>
            <div className="meta-item">
              <strong>ISBN:</strong>
              <span>{book.isbn || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <strong>Language:</strong>
              <span>{book.language.toUpperCase()}</span>
            </div>
            {book.categories.length > 0 && (
              <div className="meta-item">
                <strong>Categories:</strong>
                <div className="categories-list">
                  {book.categories.map((cat, idx) => (
                    <span key={idx} className="category-badge">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="book-description-section">
        <h2>About this book</h2>
        <p className="book-description-full">
          {book.description || 'No description available.'}
        </p>
      </div>

      <SimilarBooks
        query={`${book.title} ${book.authors[0] ?? ''}`.trim()}
        excludeTitle={book.title}
      />
    </div>
  );
}
