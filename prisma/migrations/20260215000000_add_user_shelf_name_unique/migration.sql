-- Add unique constraint to prevent duplicate shelf names per user
CREATE UNIQUE INDEX IF NOT EXISTS "shelves_userId_name_key" ON "shelves"("userId", "name");
