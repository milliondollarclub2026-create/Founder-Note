-- Migration 009: Add updated_at triggers + fix brain_dump_cache unique constraint for NULLs

BEGIN;

-- ============================================================
-- 1. Ensure the set_updated_at() trigger function exists
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. Add updated_at column to todos if it doesn't exist
-- ============================================================
ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 3. Create updated_at triggers for notes and todos
-- ============================================================
DROP TRIGGER IF EXISTS trg_notes_updated_at ON notes;
CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_todos_updated_at ON todos;
CREATE TRIGGER trg_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. Fix brain_dump_cache unique constraint to handle NULLs
--    PostgreSQL treats NULL != NULL, so the existing constraint
--    (user_id, scope_type, scope_value) allows duplicate rows
--    where scope_value IS NULL.
-- ============================================================
ALTER TABLE brain_dump_cache
  DROP CONSTRAINT IF EXISTS unique_user_scope;

CREATE UNIQUE INDEX unique_user_scope
  ON brain_dump_cache (user_id, scope_type, COALESCE(scope_value, ''));

COMMIT;
