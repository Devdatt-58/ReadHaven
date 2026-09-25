import Link from 'next/link';

export default function RecommendationsSection() {
  return (
    <div className="recommendations-container">
      <Link href="/discover" className="recommendation-text">
        <h4>Deciding what to read next?</h4>
        <p>
          Tell us the kind of story you&apos;re in the mood for and ReadHaven&apos;s
          semantic search will surface titles that match.
        </p>
      </Link>

      <Link href="/feed" className="friend-reading">
        <h4>What are your friends reading?</h4>
        <p>
          See what the community is posting and talking about on the ReadHaven
          book feed.
        </p>
      </Link>
    </div>
  );
}
