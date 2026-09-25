'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from 'next-auth';
import MobileTopBar from '../components/MobileTopBar';
import { getAccountNavItems, primaryMobileNavItems } from '../components/mobile-nav';

interface ReadingGoal {
  id: string;
  year: number;
  target: number;
}

interface ChallengeData {
  currentGoal: ReadingGoal | null;
  allGoals: ReadingGoal[];
  booksReadThisYear: number;
  currentYear: number;
}

interface Props {
  data: ChallengeData;
  user: User;
}

export default function ReadingChallengeClient({ data, user }: Props) {
  const router = useRouter();
  const [target, setTarget] = useState(data.currentGoal?.target || 20);
  const [showForm, setShowForm] = useState(!data.currentGoal);
  const [loading, setLoading] = useState(false);
  const accountItems = getAccountNavItems(Boolean(user?.id));

  const progressPercentage = data.currentGoal
    ? Math.min((data.booksReadThisYear / data.currentGoal.target) * 100, 100)
    : 0;

  const booksRemaining = data.currentGoal
    ? Math.max(data.currentGoal.target - data.booksReadThisYear, 0)
    : target;

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/reading-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: data.currentYear,
          target,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        router.refresh();
      } else {
        alert('Failed to save goal');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="challenge-page">
      <MobileTopBar
        title="Reading Challenge"
        backHref="/"
        showProfileTrigger
        navItems={primaryMobileNavItems}
        profileItems={accountItems}
      />
      <div className="challenge-header mobile-page-heading">
        <Link href="/" className="back-home">
          ← Back to Home
        </Link>
        <h1>{data.currentYear} Reading Challenge</h1>
      </div>

      <div className="challenge-container">
        {data.currentGoal ? (
          <div className="current-challenge">
            <div className="challenge-stats">
              <div className="big-number">
                <span className="books-read">{data.booksReadThisYear}</span>
                <span className="books-target">/ {data.currentGoal.target}</span>
              </div>
              <p className="stats-label">Books Read in {data.currentYear}</p>
            </div>

            <div className="progress-section">
              <div className="progress-bar-large">
                <div
                  className="progress-fill-large"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <span className="progress-text">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="challenge-info">
              {data.booksReadThisYear >= data.currentGoal.target ? (
                <div className="challenge-complete">
                  <i className="fas fa-trophy"></i>
                  <h3>🎉 Challenge Complete!</h3>
                  <p>Congratulations! You&apos;ve reached your reading goal!</p>
                </div>
              ) : (
                <div className="challenge-progress">
                  <p className="remaining-text">
                    <strong>{booksRemaining}</strong> books to go!
                  </p>
                  <p className="pace-text">
                    {Math.round(
                      booksRemaining /
                        ((12 - new Date().getMonth()) || 1)
                    )}{' '}
                    books per month to reach your goal
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="update-goal-btn"
            >
              Update Goal
            </button>
          </div>
        ) : (
          <div className="no-challenge">
            <i className="fas fa-flag-checkered"></i>
            <h3>Set Your {data.currentYear} Reading Goal</h3>
            <p>Challenge yourself to read more books this year!</p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSaveGoal} className="goal-form">
            <h3>
              {data.currentGoal ? 'Update' : 'Set'} Your {data.currentYear} Goal
            </h3>
            <div className="form-group">
              <label htmlFor="target">I want to read</label>
              <div className="target-input-group">
                <input
                  type="number"
                  id="target"
                  value={target}
                  onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                  min="1"
                  max="1000"
                  required
                  className="target-input"
                />
                <span className="input-suffix">books in {data.currentYear}</span>
              </div>
            </div>

            <div className="quick-goals">
              <p>Popular goals:</p>
              <div className="quick-goal-buttons">
                {[12, 24, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTarget(num)}
                    className="quick-goal-btn"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="save-goal-btn">
                {loading ? 'Saving...' : 'Save Goal'}
              </button>
              {data.currentGoal && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {data.allGoals.length > 0 && (
          <div className="past-challenges">
            <h3>Past Challenges</h3>
            <div className="past-goals-list">
              {data.allGoals.map((goal) => (
                <div key={goal.id} className="past-goal-card">
                  <div className="past-goal-year">{goal.year}</div>
                  <div className="past-goal-target">
                    Goal: {goal.target} books
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
