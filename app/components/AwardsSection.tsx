'use client';

import Link from 'next/link';

export default function AwardsSection() {
  const categories = {
    column1: [
      'Best Books 2025',
      'Best Fiction',
      'Best Historical Fiction',
      'Best Mystery & Thriller',
      'Best Romance',
      'Best Romantasy',
      'Best Fantasy',
      'Best Science Fiction',
    ],
    column2: [
      'Best Horror',
      'Best Young Adult Fantasy & Science Fiction',
      'Best Young Adult Fiction',
      'Best Debut Novel',
      'Best Nonfiction',
      'Best Memoir & Autobiography',
      'Best History & Biography',
      'Best Humor',
    ],
  };

  const getCategorySlug = (category: string) => {
    const normalized = category.replace(/&/g, ' and ').replace(/\s+/g, ' ').trim();
    return normalized.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <section className="awards-section">
      <div className="container"></div>
      <h1>ReadHaven Choice Awards: The Best Books 2025</h1>
      <div className="categories">
        <div className="column">
          <ul>
            {categories.column1.map((category, index) => (
              <li key={index}>
                <Link href={`/awards/${getCategorySlug(category)}`}>
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="column">
          <ul>
            {categories.column2.map((category, index) => (
              <li key={index}>
                <Link href={`/awards/${getCategorySlug(category)}`}>
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
