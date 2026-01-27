-- Migration 005: Convert notes.user_id from TEXT to UUID + add FK to auth.users
-- PRE-FLIGHT CHECK (run this first to verify only demo rows have non-UUID values):
--   SELECT id, user_id FROM notes
--   WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
-- Only 'user-...' prefixed demo rows should appear. These get deleted below.

BEGIN;

-- 1. Delete legacy demo rows from todos (FK dependency), then notes
DELETE FROM todos
WHERE note_id IN (
  SELECT id FROM notes
  WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

DELETE FROM notes
WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 2. Drop existing index
DROP INDEX IF EXISTS idx_notes_user_id;

-- 3. Convert column type from TEXT to UUID
ALTER TABLE notes
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 4. Recreate index
CREATE INDEX idx_notes_user_id ON notes(user_id);

-- 5. Add FK constraint to auth.users with cascade delete
ALTER TABLE notes
  ADD CONSTRAINT notes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMIT;
