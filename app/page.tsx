import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import HeroSection from './components/HeroSection';
import RecommendationsSection from './components/RecommendationsSection';
import DiscoverSection from './components/DiscoverSection';
import AwardsSection from './components/AwardsSection';
import SearchBrowseSection from './components/SearchBrowseSection';
import SignInContainer from './components/SignInContainer';
import ProfileContainer from './components/ProfileContainer';
import FeedSidebar from './components/FeedSidebar';
import Footer from './components/Footer';
import ScrollToSearchButton from './components/ScrollToSearchButton';
import { ensureDefaultShelves } from '@/lib/shelves';
import HomeMobileChrome from './components/HomeMobileChrome';
import { primaryMobileNavItems } from './components/mobile-nav';

async function getUserStats(userId: string) {
  await ensureDefaultShelves(userId);

  const [shelves, reviews, readingGoal, friendships] = await Promise.all([
    prisma.shelf.findMany({
      where: { userId },
      include: {
        books: true,
      },
    }),
    prisma.review.findMany({
      where: { userId },
    }),
    prisma.readingGoal.findFirst({
      where: {
        userId,
        year: new Date().getFullYear(),
      },
    }),
    prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' },
        ],
      },
    }),
  ]);

  const totalBooks = shelves.reduce((sum, shelf) => sum + shelf.books.length, 0);
  const reviewsCount = reviews.length;
  const friendsCount = friendships.length;

  return {
    shelves,
    totalBooks,
    reviewsCount,
    friendsCount,
    readingGoal,
  };
}

async function getRecentPosts() {
  const posts = await prisma.post.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      likes: {
        select: {
          id: true,
          userId: true,
        },
      },
      comments: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  return posts;
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  let userStats = null;
  const recentPosts = await getRecentPosts();

  if (session?.user?.id) {
    userStats = await getUserStats(session.user.id);
  }

  return (
    <main>
      <HomeMobileChrome
        navItems={primaryMobileNavItems}
        profileLabel={session?.user ? 'profile shortcuts' : 'account options'}
        profilePanel={
          session?.user ? (
            <ProfileContainer user={session.user} stats={userStats} />
          ) : (
            <SignInContainer />
          )
        }
        communityPanel={<FeedSidebar posts={recentPosts} currentUserId={session?.user?.id} />}
      />
      <ScrollToSearchButton />
      <HeroSection />

      <section className="page-layout">
        <div className="left-content">
          <RecommendationsSection />
          <DiscoverSection />
          <AwardsSection />
          <SearchBrowseSection />
        </div>

        <aside className="right-column">
          {session?.user ? (
            <ProfileContainer user={session.user} stats={userStats} />
          ) : (
            <SignInContainer />
          )}
          <FeedSidebar posts={recentPosts} currentUserId={session?.user?.id} />
        </aside>
      </section>

      <Footer />
    </main>
  );
}
