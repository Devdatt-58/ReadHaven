import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://read-haven-sandy.vercel.app';

const STATIC_ROUTES = [
  '',
  '/login',
  '/signup',
  '/search',
  '/feed',
  '/friends',
  '/reading-challenge',
  '/statistics',
  '/discover',
  '/awards',
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.6,
  }));

  let bookEntries: MetadataRoute.Sitemap = [];
  try {
    const books = await prisma.book.findMany({
      select: { externalId: true, updatedAt: true },
      take: 5000,
      orderBy: { updatedAt: 'desc' },
    });
    bookEntries = books.map((book) => ({
      // externalId is stored as "/works/OL…W"; the book detail route expects
      // the bare "OL…W" form.
      url: `${siteUrl}/book/${encodeURIComponent(
        book.externalId.replace(/^\/works\//, '')
      )}`,
      lastModified: book.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.4,
    }));
  } catch {
    // books table may not exist yet on first deploy
  }

  return [...staticEntries, ...bookEntries];
}
