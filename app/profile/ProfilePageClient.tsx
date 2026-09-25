'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Session } from 'next-auth';
import { shelfNameToSlug } from '@/lib/shelf-slug';
import MobileTopBar from '../components/MobileTopBar';
import { getAccountNavItems, primaryMobileNavItems } from '../components/mobile-nav';

interface Review {
  id: string;
  bookId: string;
  rating: number;
  content: string | null;
  createdAt: Date;
}

interface Shelf {
  id: string;
  name: string;
  books: Array<{ addedAt: Date | string }>;
}

interface ReadingGoal {
  id: string;
  year: number;
  target: number;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  createdAt: Date;
}

interface ProfileData {
  user: User | null;
  totalBooks: number;
  totalReviews: number;
  friendsCount: number;
  shelves: Shelf[];
  recentReviews: Review[];
  currentYearGoal: ReadingGoal | null;
  memberSince: Date | undefined;
}

interface Props {
  data: ProfileData;
  session: Session;
}

export default function ProfilePageClient({ data, session }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: data.user?.name || '',
    bio: data.user?.bio || '',
    location: data.user?.location || '',
    website: data.user?.website || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const booksReadThisYear = data.shelves
    .find(s => s.name === 'Read')
    ?.books.filter(
      b => new Date(b.addedAt).getFullYear() === currentYear
    ).length || 0;
  const accountItems = getAccountNavItems(Boolean(session.user?.id));

  return (
    <div className="profile-page">
      <MobileTopBar
        title="Profile"
        backHref="/"
        showProfileTrigger
        navItems={primaryMobileNavItems}
        profileItems={accountItems}
      />
      <div className="profile-page-header mobile-page-heading">
        <Link href="/" className="back-home">
          ← Back to Home
        </Link>
      </div>

      <div className="profile-container-page">
        <div className="profile-main-section">
          <div className="profile-card">
            <div className="profile-avatar-large">
              {data.user?.image ? (
                <img src={data.user.image} alt={data.user.name || 'User'} />
              ) : (
                <div className="avatar-placeholder-large">
                  {data.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <div className="profile-info-section">
              {!isEditing ? (
                <>
                  <h1>{data.user?.name || 'Reader'}</h1>
                  <p className="profile-email-text">{data.user?.email}</p>
                  
                  {data.user?.bio && (
                    <p className="profile-bio">{data.user.bio}</p>
                  )}
                  
                  <div className="profile-meta">
                    {data.user?.location && (
                      <span className="meta-item">
                        <i className="fas fa-map-marker-alt"></i>
                        {data.user.location}
                      </span>
                    )}
                    {data.user?.website && (
                      <a
                        href={data.user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="meta-item"
                      >
                        <i className="fas fa-link"></i>
                        {data.user.website}
                      </a>
                    )}
                    <span className="meta-item">
                      <i className="fas fa-calendar"></i>
                      Joined {new Date(data.memberSince!).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="edit-profile-btn"
                  >
                    <i className="fas fa-edit"></i>
                    Edit Profile
                  </button>
                </>
              ) : (
                <form onSubmit={handleSaveProfile} className="edit-profile-form">
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={3}
                      className="form-textarea"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      type="text"
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="form-input"
                      placeholder="City, Country"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="website">Website</label>
                    <input
                      type="url"
                      id="website"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      className="form-input"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={loading}
                      className="save-profile-btn"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <i className="fas fa-book"></i>
              <div className="stat-number">{data.totalBooks}</div>
              <div className="stat-label">Books</div>
            </div>
            <div className="stat-card">
              <i className="fas fa-star"></i>
              <div className="stat-number">{data.totalReviews}</div>
              <div className="stat-label">Reviews</div>
            </div>
            <div className="stat-card">
              <i className="fas fa-book-open"></i>
              <div className="stat-number">{booksReadThisYear}</div>
              <div className="stat-label">Read in {currentYear}</div>
            </div>
            <div className="stat-card">
              <i className="fas fa-users"></i>
              <div className="stat-number">{data.friendsCount}</div>
              <div className="stat-label">Friends</div>
            </div>
          </div>

          <div className="shelves-overview">
            <h2>My Shelves</h2>
            <div className="shelves-grid">
              {data.shelves.map((shelf) => {
                const safeName = (shelf.name ?? '').trim();
                const displayName = safeName || 'Untitled Shelf';
                const slug = shelfNameToSlug(safeName) || 'untitled-shelf';

                return (
                <Link
                  key={shelf.id}
                  href={`/shelf/${encodeURIComponent(slug)}`}
                  className="shelf-card-link"
                >
                  <div className="shelf-card">
                    <h3>{displayName}</h3>
                    <p className="shelf-book-count">{shelf.books.length} books</p>
                  </div>
                </Link>
                );
              })}
            </div>
          </div>

          {data.currentYearGoal && (
            <div className="goal-overview">
              <h2>{currentYear} Reading Challenge</h2>
              <div className="goal-card">
                <div className="goal-progress">
                  <div className="goal-numbers">
                    <span className="current">{booksReadThisYear}</span>
                    <span className="separator">/</span>
                    <span className="target">{data.currentYearGoal.target}</span>
                  </div>
                  <div className="goal-bar">
                    <div
                      className="goal-bar-fill"
                      style={{
                        width: `${Math.min(
                          (booksReadThisYear / data.currentYearGoal.target) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p className="goal-status">
                    {booksReadThisYear >= data.currentYearGoal.target
                      ? '🎉 Challenge Complete!'
                      : `${data.currentYearGoal.target - booksReadThisYear} books to go`}
                  </p>
                </div>
                <Link href="/reading-challenge" className="view-challenge-btn">
                  View Challenge
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
