import type { Metadata, Viewport } from 'next';
import './globals.css';
import AuthProvider from './components/AuthProvider';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://read-haven-sandy.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ReadHaven — Social Book Discovery',
    template: '%s · ReadHaven',
  },
  description:
    'ReadHaven is a social reading tracker: organize shelves, rate and review books, set reading goals, follow friends, and discover new titles via vector-similarity recommendations.',
  applicationName: 'ReadHaven',
  keywords: [
    'book tracker',
    'reading list',
    'social reading',
    'book recommendations',
    'book reviews',
    'reading goals',
  ],
  authors: [{ name: 'ReadHaven' }],
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'ReadHaven — Social Book Discovery',
    description:
      'Track your reading, share with friends, and discover what to read next.',
    siteName: 'ReadHaven',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReadHaven — Social Book Discovery',
    description:
      'Track your reading, share with friends, and discover what to read next.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b1020',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Paytone+One&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@100&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
