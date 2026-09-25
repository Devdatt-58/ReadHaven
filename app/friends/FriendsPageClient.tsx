'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MobileTopBar from '../components/MobileTopBar';
import { getAccountNavItems, primaryMobileNavItems } from '../components/mobile-nav';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  user: User;
  friend: User;
}

interface Activity {
  id: string;
  type: string;
  bookId: string | null;
  bookTitle: string | null;
  bookCover: string | null;
  content: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Props {
  data: {
    friends: Friendship[];
    pendingRequests: Friendship[];
    sentRequests: Friendship[];
    activities: Activity[];
  };
  currentUserId: string;
}

export default function FriendsPageClient({ data, currentUserId }: Props) {
  const router = useRouter();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'activity'>('friends');
  const accountItems = getAccountNavItems(true);

  const friendsList = data.friends.map(f => 
    f.userId === currentUserId ? f.friend : f.user
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/friends/search?email=${encodeURIComponent(searchEmail)}`);
      if (response.ok) {
        const user = await response.json();
        setSearchResult(user);
      } else {
        setSearchResult(null);
        alert('User not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });

      if (response.ok) {
        alert('Friend request sent!');
        setSearchResult(null);
        setSearchEmail('');
        router.refresh();
      } else {
        alert('Failed to send request');
      }
    } catch (error) {
      console.error('Send request error:', error);
      alert('Failed to send request');
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      const response = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to accept request');
      }
    } catch (error) {
      console.error('Accept request error:', error);
      alert('Failed to accept request');
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm('Remove this friend?')) return;

    try {
      const response = await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to remove friend');
      }
    } catch (error) {
      console.error('Remove friend error:', error);
      alert('Failed to remove friend');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'added_book': return '📚';
      case 'reviewed_book': return '⭐';
      case 'completed_challenge': return '🏆';
      default: return '📖';
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'added_book':
        return `added ${activity.bookTitle} to their shelf`;
      case 'reviewed_book':
        return `reviewed ${activity.bookTitle}`;
      case 'completed_challenge':
        return activity.content || 'completed their reading challenge';
      default:
        return activity.content || 'had activity';
    }
  };

  return (
    <div className="friends-page">
      <MobileTopBar
        title="Friends"
        backHref="/"
        showProfileTrigger={Boolean(currentUserId)}
        navItems={primaryMobileNavItems}
        profileItems={accountItems}
      />
      <div className="friends-header mobile-page-heading">
        <Link href="/" className="back-home">
          ← Back to Home
        </Link>
        <h1>Friends</h1>
      </div>

      <div className="friends-container">
        <div className="friends-search-section">
          <h3>Find Friends</h3>
          <form onSubmit={handleSearch} className="search-friends-form">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Search by email..."
              className="friend-search-input"
            />
            <button type="submit" disabled={searchLoading} className="search-friend-btn">
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResult && (
            <div className="search-result">
              <div className="user-card">
                <div className="user-avatar-small">
                  {searchResult.image ? (
                    <img src={searchResult.image} alt={searchResult.name || 'User'} />
                  ) : (
                    <div className="avatar-placeholder-small">
                      {searchResult.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="user-info">
                  <h4>{searchResult.name}</h4>
                  <p>{searchResult.email}</p>
                </div>
                <button
                  onClick={() => handleSendRequest(searchResult.id)}
                  className="add-friend-btn"
                >
                  Add Friend
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="friends-tabs">
          <button
            className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends ({friendsList.length})
          </button>
          <button
            className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests ({data.pendingRequests.length})
          </button>
          <button
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
        </div>

        <div className="friends-content">
          {activeTab === 'friends' && (
            <div className="friends-list">
              {friendsList.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-users"></i>
                  <h3>No friends yet</h3>
                  <p>Search for friends by email to connect!</p>
                </div>
              ) : (
                friendsList.map((friend) => (
                  <div key={friend.id} className="friend-card">
                    <div className="user-avatar-small">
                      {friend.image ? (
                        <img src={friend.image} alt={friend.name || 'User'} />
                      ) : (
                        <div className="avatar-placeholder-small">
                          {friend.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="user-info">
                      <h4>{friend.name}</h4>
                      <p>{friend.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        const friendship = data.friends.find(
                          f => f.userId === friend.id || f.friendId === friend.id
                        );
                        if (friendship) handleRemoveFriend(friendship.id);
                      }}
                      className="remove-friend-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="requests-list">
              {data.pendingRequests.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-envelope"></i>
                  <h3>No pending requests</h3>
                  <p>You&apos;ll see friend requests here</p>
                </div>
              ) : (
                data.pendingRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="user-avatar-small">
                      {request.user.image ? (
                        <img src={request.user.image} alt={request.user.name || 'User'} />
                      ) : (
                        <div className="avatar-placeholder-small">
                          {request.user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="user-info">
                      <h4>{request.user.name}</h4>
                      <p>{request.user.email}</p>
                    </div>
                    <div className="request-actions">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="accept-btn"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(request.id)}
                        className="decline-btn"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-feed">
              {data.activities.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-newspaper"></i>
                  <h3>No recent activity</h3>
                  <p>Your friends&apos; reading activity will appear here</p>
                </div>
              ) : (
                data.activities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="activity-content">
                      <p>
                        <strong>{activity.user.name}</strong>{' '}
                        {getActivityText(activity)}
                      </p>
                      {activity.bookCover && activity.bookId && (
                        <Link href={`/book/${activity.bookId}`} className="activity-book">
                          <img src={activity.bookCover} alt={activity.bookTitle || ''} />
                        </Link>
                      )}
                      <span className="activity-time">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
