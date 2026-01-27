-- Migration 007: Replace wide-open RLS policies on notes and todos with owner-only policies

BEGIN;

-- ============================================================
-- NOTES: Secure RLS policies
-- ============================================================

-- Drop the wide-open policy
DROP POLICY IF EXISTS "Allow all operations on notes" ON notes;

-- Owner-only SELECT
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Owner-only INSERT
CREATE POLICY "Users can create own notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owner-only UPDATE
CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner-only DELETE
CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Revoke public/anon access, grant to authenticated and service_role
REVOKE ALL ON notes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON notes TO authenticated;
GRANT ALL ON notes TO service_role;

-- ============================================================
-- TODOS: Secure RLS policies
-- ============================================================

-- Drop the wide-open policy
DROP POLICY IF EXISTS "Allow all operations on todos" ON todos;

-- Owner-only SELECT
CREATE POLICY "Users can view own todos"
  ON todos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Owner-only INSERT
CREATE POLICY "Users can create own todos"
  ON todos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owner-only UPDATE
CREATE POLICY "Users can update own todos"
  ON todos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner-only DELETE
CREATE POLICY "Users can delete own todos"
  ON todos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Revoke public/anon access, grant to authenticated and service_role
REVOKE ALL ON todos FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON todos TO authenticated;
GRANT ALL ON todos TO service_role;

-- ============================================================
-- USER_PROFILES: Safety check — drop wide-open policy if it exists
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;

COMMIT;
