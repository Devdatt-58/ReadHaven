'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from 'next-auth';
import MobileTopBar from '../../components/MobileTopBar';
import { getAccountNavItems, primaryMobileNavItems } from '../../components/mobile-nav';

interface ShelfBook {
  id: string;
  bookId: string;
  title: string;
  authors: string[];
  thumbnail: string | null;
  addedAt: Date;
}

interface Shelf {
  id: string;
  name: string;
  books: ShelfBook[];
}

interface Props {
  shelf: Shelf;
  user: User;
}

export default function ShelfPageClient({ shelf, user }: Props) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'author'>('date');
  const accountItems = getAccountNavItems(Boolean(user?.id));

  const sortedBooks = [...shelf.books].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'author':
        return a.authors[0]?.localeCompare(b.authors[0] || '') || 0;
      case 'date':
      default:
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
  });

  const handleRemoveBook = async (shelfBookId: string) => {
    if (!confirm('Remove this book from the shelf?')) return;

    try {
      const response = await fetch('/api/shelves/remove-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shelfBookId }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to remove book');
      }
    } catch (error) {
      console.error('Error removing book:', error);
      alert('Failed to remove book');
    }
  };

  return (
    <div className="shelf-page">
      <MobileTopBar
        title={shelf.name}
        backHref="/profile"
        showProfileTrigger
        navItems={primaryMobileNavItems}
        profileItems={accountItems}
      />
      <div className="shelf-header mobile-page-heading">
        <Link href="/" className="back-home">
          ← Back to Home
        </Link>
        <div className="shelf-title-section">
          <h1>{shelf.name}</h1>
          <p className="shelf-count">{shelf.books.length} books</p>
        </div>

        <div className="shelf-controls">
          <label htmlFor="sort">Sort by:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'author')}
            className="sort-select"
          >
            <option value="date">Date Added</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
          </select>
        </div>
      </div>

      {shelf.books.length === 0 ? (
        <div className="empty-shelf">
          <i className="fas fa-book"></i>
          <h3>This shelf is empty</h3>
          <p>Start adding books to your {shelf.name} shelf!</p>
          <Link href="/search" className="browse-books-btn">
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="shelf-books-grid">
          {sortedBooks.map((book) => (
            <div key={book.id} className="shelf-book-card">
              <Link href={`/book/${book.bookId}`} className="book-link">
                <div className="shelf-book-cover">
                  <img
                    src={book.thumbnail || '/images/no-cover.jpg'}
                    alt={book.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/no-cover.jpg';
                    }}
                  />
                </div>
                <div className="shelf-book-info">
                  <h3 className="shelf-book-title">{book.title}</h3>
                  <p className="shelf-book-authors">
                    by {book.authors.join(', ')}
                  </p>
                  <p className="shelf-book-date">
                    Added {new Date(book.addedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => handleRemoveBook(book.id)}
                className="remove-book-btn"
                title="Remove from shelf"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
