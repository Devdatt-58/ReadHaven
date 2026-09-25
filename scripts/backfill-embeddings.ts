import { prisma } from '../lib/prisma';
import { embedBatch, toVectorLiteral } from '../lib/embeddings';

const BATCH_SIZE = 16;

interface BookRow {
  id: string;
  title: string;
  author: string;
  description: string;
  subjects: string[];
}

function textFor(book: BookRow): string {
  const subjects = book.subjects.slice(0, 5).join(', ');
  return `${book.title} by ${book.author}. ${book.description}${
    subjects ? ` Subjects: ${subjects}` : ''
  }`.slice(0, 1000);
}

// ivfflat trains its centroids on the data present when the index is created,
// so the index is (re)built here — after embeddings exist — rather than in the
// table migration, where the books table is still empty.
async function buildVectorIndex() {
  const result = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count FROM "books" WHERE "embedding" IS NOT NULL
  `;
  const embedded = Number(result[0]?.count ?? 0);
  if (embedded === 0) {
    console.log('No embeddings present; skipping vector index build.');
    return;
  }

  const lists = Math.max(1, Math.round(Math.sqrt(embedded)));
  await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "books_embedding_cosine_idx"');
  await prisma.$executeRawUnsafe(
    `CREATE INDEX "books_embedding_cosine_idx" ON "books" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = ${lists})`
  );
  console.log(`Built ivfflat index over ${embedded} embeddings (lists = ${lists}).`);
}

async function main() {
  const rows = await prisma.$queryRaw<BookRow[]>`
    SELECT id, title, author, description, subjects
    FROM "books"
    WHERE "embedding" IS NULL
    ORDER BY "createdAt" ASC
  `;

  console.log(`${rows.length} books need embeddings`);

  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const texts = batch.map(textFor);
    const vectors = await embedBatch(texts);

    for (let j = 0; j < batch.length; j++) {
      const literal = toVectorLiteral(vectors[j]);
      await prisma.$executeRawUnsafe(
        `UPDATE "books" SET "embedding" = $1::vector, "updatedAt" = NOW() WHERE "id" = $2`,
        literal,
        batch[j].id
      );
    }

    done += batch.length;
    if (done % 100 === 0 || done === rows.length) {
      console.log(`  embedded ${done}/${rows.length}`);
    }
  }

  await buildVectorIndex();
  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
