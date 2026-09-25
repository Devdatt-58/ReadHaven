CREATE EXTENSION IF NOT EXISTS "vector";

CREATE INDEX IF NOT EXISTS "posts_userId_createdAt_idx"
  ON "posts" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "posts_createdAt_idx"
  ON "posts" ("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "friendships_userId_status_idx"
  ON "friendships" ("userId", "status");

CREATE INDEX IF NOT EXISTS "friendships_friendId_status_idx"
  ON "friendships" ("friendId", "status");

CREATE INDEX IF NOT EXISTS "reviews_userId_createdAt_idx"
  ON "reviews" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "reviews_bookId_createdAt_idx"
  ON "reviews" ("bookId", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS "books" (
  "id"          TEXT          PRIMARY KEY,
  "externalId"  TEXT          NOT NULL,
  "source"      TEXT          NOT NULL DEFAULT 'openlibrary',
  "title"       TEXT          NOT NULL,
  "author"      TEXT          NOT NULL,
  "description" TEXT          NOT NULL DEFAULT '',
  "subjects"    TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
  "year"        INTEGER,
  "isbn"        TEXT,
  "coverUrl"    TEXT,
  "embedding"   vector(384),
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)  NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "books_externalId_key" ON "books" ("externalId");
CREATE INDEX IF NOT EXISTS "books_isbn_idx" ON "books" ("isbn");
CREATE INDEX IF NOT EXISTS "books_author_idx" ON "books" ("author");

CREATE INDEX IF NOT EXISTS "books_embedding_cosine_idx"
  ON "books" USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);
