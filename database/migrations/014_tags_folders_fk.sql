-- ============================
-- Migration: Add foreign keys to tags and folders tables
-- Links user_id to auth.users with cascade delete
-- ============================

begin;

-- Add FK constraint for tags.user_id
ALTER TABLE public.tags
ADD CONSTRAINT tags_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add FK constraint for folders.user_id
ALTER TABLE public.folders
ADD CONSTRAINT folders_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

commit;
