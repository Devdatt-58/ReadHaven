import { prisma } from '../lib/prisma';

interface OLDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  first_sentence?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  subject?: string[];
}

const QUERIES = [
  'fiction', 'mystery', 'science', 'history', 'philosophy',
  'biography', 'fantasy', 'romance', 'thriller', 'poetry',
  'self-help', 'business', 'classic', 'cooking', 'travel',
  'horror', 'science fiction', 'young adult', 'memoir', 'children',
];

const PAGES_PER_QUERY = 20;
const PAGE_SIZE = 20;
const DELAY_MS = 250;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(query: string, page: number): Promise<OLDoc[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    query
  )}&page=${page}&limit=${PAGE_SIZE}&fields=key,title,author_name,first_sentence,first_publish_year,isbn,cover_i,subject`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'ReadHaven-Seeder/1.0' },
  });

  if (!response.ok) {
    console.warn(`  ! HTTP ${response.status} for "${query}" page ${page}`);
    return [];
  }

  const data = (await response.json()) as { docs?: OLDoc[] };
  return Array.isArray(data.docs) ? data.docs : [];
}

function normalize(doc: OLDoc) {
  if (!doc.key || !doc.title) return null;

  const author = doc.author_name?.[0]?.trim() || 'Unknown';
  const description =
    doc.first_sentence?.[0]?.trim() ||
    (doc.subject?.slice(0, 5).join(', ') ?? '');

  return {
    externalId: doc.key,
    source: 'openlibrary' as const,
    title: doc.title.trim().slice(0, 500),
    author: author.slice(0, 300),
    description: description.slice(0, 2000),
    subjects: (doc.subject ?? []).slice(0, 12).map((s) => s.slice(0, 100)),
    year: doc.first_publish_year ?? null,
    isbn: doc.isbn?.[0] ?? null,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : null,
  };
}

async function main() {
  const startCount = await prisma.book.count();
  console.log(`Starting count: ${startCount} books`);

  let inserted = 0;
  let skipped = 0;
  const seenIsbn = new Set<string>();

  for (const query of QUERIES) {
    for (let page = 1; page <= PAGES_PER_QUERY; page++) {
      const docs = await fetchPage(query, page);
      if (docs.length === 0) break;

      for (const doc of docs) {
        const book = normalize(doc);
        if (!book) {
          skipped++;
          continue;
        }
        if (book.isbn && seenIsbn.has(book.isbn)) {
          skipped++;
          continue;
        }
        if (book.isbn) seenIsbn.add(book.isbn);

        try {
          await prisma.book.upsert({
            where: { externalId: book.externalId },
            create: book,
            update: {
              title: book.title,
              author: book.author,
              description: book.description,
              subjects: book.subjects,
              year: book.year ?? undefined,
              isbn: book.isbn ?? undefined,
              coverUrl: book.coverUrl ?? undefined,
            },
          });
          inserted++;
        } catch (err) {
          skipped++;
          console.warn(`  ! Failed to upsert ${book.externalId}:`, err);
        }
      }

      console.log(`  ${query} p${page}: +${docs.length} (total ${inserted})`);
      await sleep(DELAY_MS);
    }
  }

  const endCount = await prisma.book.count();
  console.log(`\nDone. ${endCount} books total (+${endCount - startCount} new, ${skipped} skipped)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
