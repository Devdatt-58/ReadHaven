'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { User } from 'next-auth';

interface Shelf {
  id: string;
  name: string;
  books: unknown[];
}

interface ReadingGoal {
  id: string;
  year: number;
  target: number;
}

interface Stats {
  shelves: Shelf[];
  totalBooks: number;
  reviewsCount: number;
  friendsCount: number;
  readingGoal: ReadingGoal | null;
}

interface ProfileContainerProps {
  user: User;
  stats: Stats | null;
}

export default function ProfileContainer({ user, stats }: ProfileContainerProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const currentYear = new Date().getFullYear();
  const booksRead = stats?.totalBooks || 0;
  const goalTarget = stats?.readingGoal?.target || 20;
  const progressPercentage = Math.min((booksRead / goalTarget) * 100, 100);

  // Find specific shelves
  const wantToReadShelf = stats?.shelves.find(s => s.name === 'Want to Read');
  const currentlyReadingShelf = stats?.shelves.find(s => s.name === 'Currently Reading');
  const readShelf = stats?.shelves.find(s => s.name === 'Read');
  const favoritesShelf = stats?.shelves.find(s => s.name === 'Favorites');

  return (
    <div className="profile-container">
      {/* User Info Section */}
      <div className="profile-header">
        <div className="profile-avatar">
          {user.image ? (
            <img src={user.image} alt={user.name || 'User'} />
          ) : (
            <div className="avatar-placeholder">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h3>{user.name || 'Reader'}</h3>
          <p className="profile-email">{user.email}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="profile-stats">
        <div className="stat-item">
          <span className="stat-number">{stats?.totalBooks || 0}</span>
          <span className="stat-label">Books</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats?.reviewsCount || 0}</span>
          <span className="stat-label">Reviews</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats?.friendsCount || 0}</span>
          <span className="stat-label">Friends</span>
        </div>
      </div>

      {/* Shelves Section */}
      <div className="profile-section">
        <h4 className="section-title">My Shelves</h4>
        <ul className="shelf-list">
          <li className="shelf-item">
            <Link href="/shelf/want-to-read">
              <i className="fas fa-bookmark"></i>
              <span>Want to Read</span>
              <span className="shelf-count">{wantToReadShelf?.books.length || 0}</span>
            </Link>
          </li>
          <li className="shelf-item">
            <Link href="/shelf/currently-reading">
              <i className="fas fa-book-open"></i>
              <span>Currently Reading</span>
              <span className="shelf-count">{currentlyReadingShelf?.books.length || 0}</span>
            </Link>
          </li>
          <li className="shelf-item">
            <Link href="/shelf/read">
              <i className="fas fa-check-circle"></i>
              <span>Read</span>
              <span className="shelf-count">{readShelf?.books.length || 0}</span>
            </Link>
          </li>
          {favoritesShelf && (
            <li className="shelf-item">
              <Link href="/shelf/favorites">
                <i className="fas fa-heart"></i>
                <span>Favorites</span>
                <span className="shelf-count">{favoritesShelf.books.length}</span>
              </Link>
            </li>
          )}
        </ul>
      </div>

      {/* Quick Links */}
      <div className="profile-section">
        <h4 className="section-title">Quick Links</h4>
        <ul className="quick-links">
          <li>
            <Link href="/create-post">
              <i className="fas fa-plus-circle"></i>
              Create Post
            </Link>
          </li>
          <li>
            <Link href="/feed">
              <i className="fas fa-rss"></i>
              Book Feed
            </Link>
          </li>
          <li>
            <Link href="/profile">
              <i className="fas fa-user"></i>
              View Profile
            </Link>
          </li>
          <li>
            <Link href="/reviews">
              <i className="fas fa-star"></i>
              My Reviews
            </Link>
          </li>
          <li>
            <Link href="/friends">
              <i className="fas fa-users"></i>
              My Friends
            </Link>
          </li>
          <li>
            <Link href="/statistics">
              <i className="fas fa-chart-bar"></i>
              Reading Stats
            </Link>
          </li>
          <li>
            <Link href="/reading-challenge">
              <i className="fas fa-trophy"></i>
              Reading Challenge
            </Link>
          </li>
        </ul>
      </div>

      {/* Current Reading Progress */}
      <div className="profile-section">
        <h4 className="section-title">{currentYear} Reading Goal</h4>
        <div className="reading-goal">
          <div className="goal-progress-bar">
            <div 
              className="goal-progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="goal-text">{booksRead} of {goalTarget} books read</p>
          <Link href="/reading-challenge" className="goal-link">
            {stats?.readingGoal ? 'Update Goal' : 'Set Goal'}
          </Link>
        </div>
      </div>

      {/* Sign Out Button */}
      <button onClick={handleSignOut} className="sign-out-btn">
        <i className="fas fa-sign-out-alt"></i>
        Sign Out
      </button>
    </div>
  );
}
