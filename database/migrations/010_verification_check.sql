-- ============================================================
-- VERIFICATION SCRIPT — Run after migrations 005-009
-- Each query should return the EXPECTED result noted in comments.
-- If any query returns unexpected results, that migration failed.
-- ============================================================

-- ============================================================
-- CHECK 1: notes.user_id is UUID (not TEXT)
-- EXPECTED: data_type = 'uuid'
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notes'
  AND column_name = 'user_id';

-- ============================================================
-- CHECK 2: todos.user_id is UUID (not TEXT)
-- EXPECTED: data_type = 'uuid'
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'todos'
  AND column_name = 'user_id';

-- ============================================================
-- CHECK 3: todos.updated_at column exists
-- EXPECTED: 1 row with data_type = 'timestamp with time zone'
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'todos'
  AND column_name = 'updated_at';

-- ============================================================
-- CHECK 4: FK constraints exist for all 5 tables → auth.users
-- EXPECTED: 5 rows (notes, todos, intents, brain_dump_cache, user_profiles)
-- ============================================================
SELECT
  tc.table_name,
  tc.constraint_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
  AND ccu.table_schema = 'auth'
ORDER BY tc.table_name;

-- ============================================================
-- CHECK 5: No legacy demo rows remain (non-UUID user_id)
-- EXPECTED: 0 rows
-- ============================================================
SELECT 'notes' AS table_name, count(*) AS bad_rows
FROM notes WHERE user_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
UNION ALL
SELECT 'todos', count(*)
FROM todos WHERE user_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ============================================================
-- CHECK 6: Wide-open RLS policies are GONE
-- EXPECTED: 0 rows (no "Allow all operations" policies)
-- ============================================================
SELECT tablename, policyname
FROM pg_policies
WHERE policyname ILIKE '%allow all%'
  AND tablename IN ('notes', 'todos', 'user_profiles');

-- ============================================================
-- CHECK 7: Secure owner-only RLS policies exist on notes
-- EXPECTED: 4 rows (SELECT, INSERT, UPDATE, DELETE)
-- ============================================================
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'notes'
  AND schemaname = 'public'
ORDER BY cmd;

-- ============================================================
-- CHECK 8: Secure owner-only RLS policies exist on todos
-- EXPECTED: 4 rows (SELECT, INSERT, UPDATE, DELETE)
-- ============================================================
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'todos'
  AND schemaname = 'public'
ORDER BY cmd;

-- ============================================================
-- CHECK 9: updated_at triggers exist on notes and todos
-- EXPECTED: 2 rows (trg_notes_updated_at, trg_todos_updated_at)
-- ============================================================
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN ('trg_notes_updated_at', 'trg_todos_updated_at');

-- ============================================================
-- CHECK 10: brain_dump_cache unique index uses COALESCE
-- EXPECTED: 1 row with indexname = 'unique_user_scope'
-- ============================================================
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'brain_dump_cache'
  AND indexname = 'unique_user_scope';

-- ============================================================
-- CHECK 11: RLS is enabled on all public tables
-- EXPECTED: All tables show rowsecurity = true
-- ============================================================
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname IN ('notes', 'todos', 'user_profiles', 'intents', 'brain_dump_cache')
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY relname;

-- ============================================================
-- SUMMARY: If all checks pass:
--   Check 1:  uuid
--   Check 2:  uuid
--   Check 3:  1 row (timestamp with time zone)
--   Check 4:  5 rows (all tables FK → auth.users)
--   Check 5:  0 bad_rows in both tables
--   Check 6:  0 rows (no wide-open policies)
--   Check 7:  4 rows (notes policies)
--   Check 8:  4 rows (todos policies)
--   Check 9:  2 rows (both triggers)
--   Check 10: 1 row (COALESCE index)
--   Check 11: 5 rows, all true
-- ============================================================
