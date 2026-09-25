import { Suspense } from 'react';
import DiscoverClient from './DiscoverClient';

export const metadata = {
  title: 'Discover',
  description:
    'Find your next book with semantic search over the ReadHaven catalogue.',
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="discover-page">Loading…</div>}>
      <DiscoverClient />
    </Suspense>
  );
}
