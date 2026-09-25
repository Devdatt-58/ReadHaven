'use client';

import Link from 'next/link';
import MobileTopBar from '../components/MobileTopBar';
import { getAccountNavItems, primaryMobileNavItems } from '../components/mobile-nav';

interface ReadingGoal {
  year: number;
  target: number;
}

interface Stats {
  totalBooks: number;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: number[];
  booksByYear: { [year: number]: number };
  booksByMonth: number[];
  goals: ReadingGoal[];
  booksThisYear: number;
}

interface Props {
  stats: Stats;
}

export default function StatisticsPageClient({ stats }: Props) {
  const currentYear = new Date().getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const accountItems = getAccountNavItems(true);
  
  const years = Object.keys(stats.booksByYear).sort((a, b) => parseInt(b) - parseInt(a));
  const maxBooksInMonth = Math.max(...stats.booksByMonth, 1);

  return (
    <div className="statistics-page">
      <MobileTopBar
        title="Reading Stats"
        backHref="/"
        showProfileTrigger
        navItems={primaryMobileNavItems}
        profileItems={accountItems}
      />
      <div className="statistics-header mobile-page-heading">
        <Link href="/" className="back-home">
          ← Back to Home
        </Link>
        <h1>Reading Statistics</h1>
      </div>

      <div className="statistics-container">
        {/* Overview Cards */}
        <div className="stats-overview">
          <div className="overview-card">
            <i className="fas fa-book"></i>
            <div className="overview-number">{stats.totalBooks}</div>
            <div className="overview-label">Total Books Read</div>
          </div>
          <div className="overview-card">
            <i className="fas fa-calendar"></i>
            <div className="overview-number">{stats.booksThisYear}</div>
            <div className="overview-label">Books This Year</div>
          </div>
          <div className="overview-card">
            <i className="fas fa-star"></i>
            <div className="overview-number">{stats.averageRating.toFixed(1)}</div>
            <div className="overview-label">Average Rating</div>
          </div>
          <div className="overview-card">
            <i className="fas fa-pen"></i>
            <div className="overview-number">{stats.totalReviews}</div>
            <div className="overview-label">Reviews Written</div>
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="stats-section">
          <h2>{currentYear} Monthly Reading</h2>
          <div className="bar-chart">
            {stats.booksByMonth.map((count, index) => (
              <div key={index} className="bar-container">
                <div 
                  className="bar"
                  style={{ height: `${(count / maxBooksInMonth) * 200}px` }}
                  title={`${count} books`}
                >
                  {count > 0 && <span className="bar-value">{count}</span>}
                </div>
                <div className="bar-label">{months[index]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="stats-section">
          <h2>Rating Distribution</h2>
          <div className="rating-bars">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating - 1];
              const percentage = stats.totalReviews > 0 
                ? (count / stats.totalReviews) * 100 
                : 0;
              
              return (
                <div key={rating} className="rating-bar-row">
                  <div className="rating-stars">
                    {rating} <i className="fas fa-star filled"></i>
                  </div>
                  <div className="rating-bar-container">
                    <div 
                      className="rating-bar-fill"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="rating-count">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Books by Year */}
        <div className="stats-section">
          <h2>Books by Year</h2>
          <div className="year-stats">
            {years.map(year => (
              <div key={year} className="year-row">
                <div className="year-label">{year}</div>
                <div className="year-bar-container">
                  <div 
                    className="year-bar"
                    style={{ 
                      width: `${(stats.booksByYear[parseInt(year)] / stats.totalBooks) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="year-count">{stats.booksByYear[parseInt(year)]} books</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reading Goals History */}
        {stats.goals.length > 0 && (
          <div className="stats-section">
            <h2>Reading Goals History</h2>
            <div className="goals-history">
              {stats.goals.map(goal => {
                const booksRead = stats.booksByYear[goal.year] || 0;
                const percentage = (booksRead / goal.target) * 100;
                const completed = booksRead >= goal.target;

                return (
                  <div key={goal.year} className="goal-history-row">
                    <div className="goal-year">{goal.year}</div>
                    <div className="goal-info">
                      <div className="goal-progress-text">
                        {booksRead} / {goal.target} books
                      </div>
                      <div className="goal-progress-bar-small">
                        <div 
                          className={`goal-progress-fill-small ${completed ? 'completed' : ''}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    {completed && (
                      <div className="goal-badge">
                        <i className="fas fa-trophy"></i> Complete
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reading Insights */}
        <div className="stats-section">
          <h2>Reading Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <i className="fas fa-fire"></i>
              <h3>Most Productive Month</h3>
              <p>{months[stats.booksByMonth.indexOf(Math.max(...stats.booksByMonth))]}</p>
              <span>{Math.max(...stats.booksByMonth)} books</span>
            </div>
            <div className="insight-card">
              <i className="fas fa-chart-line"></i>
              <h3>Average per Month</h3>
              <p>{(stats.booksThisYear / (new Date().getMonth() + 1)).toFixed(1)}</p>
              <span>books this year</span>
            </div>
            <div className="insight-card">
              <i className="fas fa-heart"></i>
              <h3>Favorite Rating</h3>
              <p>{stats.ratingDistribution.indexOf(Math.max(...stats.ratingDistribution)) + 1} Stars</p>
              <span>most common</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
