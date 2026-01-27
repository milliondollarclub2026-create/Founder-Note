-- Migration 006: Convert todos.user_id from TEXT to UUID + add FK to auth.users
-- PRE-FLIGHT CHECK (run this first to verify only demo rows have non-UUID values):
--   SELECT id, user_id FROM todos
--   WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

BEGIN;

-- 1. Delete legacy demo rows with non-UUID user_id
DELETE FROM todos
WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 2. Drop existing index
DROP INDEX IF EXISTS idx_todos_user_id;

-- 3. Convert column type from TEXT to UUID
ALTER TABLE todos
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 4. Recreate index
CREATE INDEX idx_todos_user_id ON todos(user_id);

-- 5. Add FK constraint to auth.users with cascade delete
ALTER TABLE todos
  ADD CONSTRAINT todos_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMIT;
