import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-column">
          <h4>READHAVEN</h4>
          <p>
            A personal reading tracker. Search books, build shelves,
            log reviews, and share posts with friends.
          </p>
        </div>

        <div className="footer-column">
          <h4>EXPLORE</h4>
          <ul>
            <li><Link href="/search">Search books</Link></li>
            <li><Link href="/discover">Discover (semantic)</Link></li>
            <li><Link href="/feed">Community feed</Link></li>
            <li><Link href="/reading-challenge">Reading challenge</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>BUILT WITH</h4>
          <ul>
            <li>Next.js, TypeScript, Prisma</li>
            <li>PostgreSQL, NextAuth.js</li>
            <li>Google Books &amp; Open Library APIs</li>
          </ul>
          <p>
            &copy; {new Date().getFullYear()} ReadHaven
          </p>
        </div>
      </div>
    </footer>
  );
}
