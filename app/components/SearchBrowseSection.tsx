'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBrowseSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const genres = [
    'Art', 'Biography', 'Business', "Children's", 'Christian',
    'Classics', 'Comics', 'Cookbooks', 'Ebooks', 'Fantasy',
    'Fiction', 'Graphic Novels', 'Historical Fiction', 'History', 'Horror',
    'Memoir', 'Music', 'Mystery', 'Nonfiction', 'Poetry',
    'Psychology', 'Romance', 'Science', 'Science Fiction', 'Self Help',
    'Sports', 'Thriller', 'Travel', 'Young Adult', 'More genres',
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleGenreClick = (genre: string) => {
    router.push(`/search?q=${encodeURIComponent(genre)}`);
  };

  return (
    <div className="search-browse-section">
      <h3>Search and browse books</h3>
      <form onSubmit={handleSearch}>
        <input 
          type="text" 
          className="search-input" 
          placeholder="Title / Author / ISBN"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search books"
        />
      </form>

      <div className="browse-links-grid">
        {genres.map((genre, index) => (
          <a 
            key={index} 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              handleGenreClick(genre);
            }}
          >
            {genre}
          </a>
        ))}
      </div>
    </div>
  );
}
