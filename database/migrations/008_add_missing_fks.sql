-- Migration 008: Add missing FK constraints for intents and brain_dump_cache

BEGIN;

-- intents.user_id → auth.users(id) ON DELETE CASCADE
ALTER TABLE intents
  ADD CONSTRAINT intents_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- brain_dump_cache.user_id → auth.users(id) ON DELETE CASCADE
ALTER TABLE brain_dump_cache
  ADD CONSTRAINT brain_dump_cache_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMIT;
