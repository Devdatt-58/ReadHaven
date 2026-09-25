'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from 'next-auth';
import MobileTopBar from '../components/MobileTopBar';
import { getAccountNavItems, primaryMobileNavItems } from '../components/mobile-nav';

interface SearchBook {
  id: string;
  title: string;
  authors?: string[];
  thumbnail: string;
}

interface Props {
  user: User;
}

export default function CreatePostClient({ user }: Props) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<SearchBook | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const accountItems = getAccountNavItems(Boolean(user?.id));

  const handleSearchBooks = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `/api/books/search?q=${encodeURIComponent(searchQuery)}&page=1`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.books.slice(0, 5));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('Please write something');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          bookId: selectedBook?.id,
          bookTitle: selectedBook?.title,
          bookCover: selectedBook?.thumbnail,
          bookAuthors: selectedBook?.authors?.join(', '),
        }),
      });

      if (response.ok) {
        router.push('/feed');
      } else {
        alert('Failed to create post');
      }
    } catch (error) {
      console.error('Post error:', error);
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-page">
      <MobileTopBar
        title="Create Post"
        backHref="/feed"
        showProfileTrigger
        navItems={primaryMobileNavItems}
        profileItems={accountItems}
      />
      <div className="create-post-header mobile-page-heading">
        <Link href="/" className="back-home">
          ← Back
        </Link>
        <h1>Create Post</h1>
      </div>

      <div className="create-post-container">
        <form onSubmit={handleSubmit} className="post-form">
          <div className="post-user-section">
            <div className="post-user-avatar">
              {user.image ? (
                <img src={user.image} alt={user.name || 'User'} />
              ) : (
                <div className="avatar-placeholder-post">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="post-user-name">{user.name}</div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about a book..."
            className="post-textarea"
            rows={6}
            required
          />

          {selectedBook && (
            <div className="selected-book">
              <img src={selectedBook.thumbnail} alt={selectedBook.title} />
              <div className="selected-book-info">
                <h4>{selectedBook.title}</h4>
                <p>{selectedBook.authors?.join(', ')}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="remove-book-btn"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          <div className="book-search-section">
            <h3>Attach a Book (Optional)</h3>
            <div className="book-search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a book..."
                className="book-search-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchBooks();
                  }
                }}
              />
              <button 
                type="button" 
                onClick={handleSearchBooks}
                disabled={searching} 
                className="search-book-btn"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="book-results">
                {searchResults.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => {
                      setSelectedBook(book);
                      setSearchResults([]);
                      setSearchQuery('');
                    }}
                    className="book-result-item"
                  >
                    <img src={book.thumbnail} alt={book.title} />
                    <div className="book-result-info">
                      <h5>{book.title}</h5>
                      <p>{book.authors?.join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="submit-post-btn">
            {loading ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
