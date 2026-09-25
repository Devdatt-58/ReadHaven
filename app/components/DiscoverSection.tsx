import Link from 'next/link';
import Image from 'next/image';

interface BookItem {
  image: string;
  title: string;
  author: string;
}

interface BookSeriesProps {
  userName: string;
  books: BookItem[];
  likedBook: BookItem;
  themes: string[];
}

const buildBookResolveHref = (title: string, author: string) =>
  `/book/resolve?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`;

function BookSeries({ userName, books, likedBook, themes }: BookSeriesProps) {
  return (
    <div className="book-series-1">
      <div className="liked-text">Because {userName} liked...</div>
      <div className="discovered-text">She discovered:</div>
      
      <div className="book-flow">
        {/* Books row */}
        {books.map((book) => (
          <Link
            key={`${book.title}-${book.author}`}
            href={buildBookResolveHref(book.title, book.author)}
            aria-label={`${book.title} by ${book.author}`}
          >
            <Image
              src={book.image}
              alt={`${book.title} by ${book.author}`}
              className="book-image"
              width={100}
              height={150}
            />
          </Link>
        ))}

        {/* Arrow */}
        <svg 
          className="arrow-image" 
          xmlns="http://www.w3.org/2000/svg" 
          width="50" 
          height="50" 
          viewBox="0 0 24 24" 
          fill="#b9b2a4"
        >
          <path d="M22 12l-8 8v-6h-8v-4h8v-6z" />
        </svg>

        {/* Liked book */}
        <div className="liked-book">
          <Link
            href={buildBookResolveHref(likedBook.title, likedBook.author)}
            aria-label={`${likedBook.title} by ${likedBook.author}`}
          >
            <img 
              src={likedBook.image}
              alt={`${likedBook.title} by ${likedBook.author}`}
              className="book-image liked"
            />
          </Link>
        </div>

        {/* Passage text */}
        <div className="passage-text">
          {themes.map((theme, index) => (
            <span key={index}>
              {theme}
              {index < themes.length - 1 && <>,<br /></>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DiscoverSection() {
  const shagunData = {
    userName: 'Shagun',
    books: [
      { image: '/images/book1.jpeg', title: 'Anna Karenina', author: 'Leo Tolstoy' },
      { image: '/images/book2.jpeg', title: 'Madame Bovary', author: 'Gustave Flaubert' },
      { image: '/images/book3.jpeg', title: 'War and Peace', author: 'Leo Tolstoy' },
      { image: '/images/book4.jpeg', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
      { image: '/images/book9.jpeg', title: 'To Kill a Mockingbird', author: 'Harper Lee' },
    ],
    likedBook: {
      image: '/images/liked-book1.jpeg',
      title: 'To the Lighthouse',
      author: 'Virginia Woolf',
    },
    themes: ['The passage of time', 'The nature of art', 'The female experience'],
  };

  const dristiiiData = {
    userName: 'Dristiii',
    books: [
      {
        image: '/images/book5.jpeg',
        title: 'The Adventures of Huckleberry Finn',
        author: 'Mark Twain',
      },
      { image: '/images/book6.jpeg', title: 'Swann\'s Way', author: 'Marcel Proust' },
      { image: '/images/book7.jpeg', title: 'Hamlet', author: 'William Shakespeare' },
      {
        image: '/images/book8.jpeg',
        title: 'Crime and Punishment',
        author: 'Fyodor Dostoevsky',
      },
      {
        image: '/images/book10.jpeg',
        title: 'The Canterbury Tales',
        author: 'Geoffrey Chaucer',
      },
    ],
    likedBook: {
      image: '/images/liked-book2.jpeg',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
    },
    themes: ['Manners', 'Upbringing', 'Morality', 'Education'],
  };

  return (
    <div className="discover-section">
      <h2>What will you discover?</h2>
      <BookSeries {...shagunData} />
      <div className="book-series-2">
        <BookSeries {...dristiiiData} />
      </div>
    </div>
  );
}
