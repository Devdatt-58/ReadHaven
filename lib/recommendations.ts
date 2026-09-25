import { prisma } from './prisma';
import { embed, toVectorLiteral } from './embeddings';

export interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string | null;
  distance: number;
}

/**
 * Semantic search over the local book catalogue: embed the free-text query,
 * then rank books by pgvector cosine distance against their stored embeddings.
 */
export async function recommendForQuery(
  query: string,
  limit = 5
): Promise<RecommendedBook[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const vector = await embed(trimmed);
  const literal = toVectorLiteral(vector);

  const rows = await prisma.$queryRawUnsafe<RecommendedBook[]>(
    `
      SELECT
        b.id,
        b.title,
        b.author,
        b.description,
        b."coverUrl",
        b.embedding <=> $1::vector AS distance
      FROM "books" b
      WHERE b.embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT $2
    `,
    literal,
    limit
  );
  return rows;
}
