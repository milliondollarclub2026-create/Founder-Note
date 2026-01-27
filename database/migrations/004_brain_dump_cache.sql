-- ============================
-- Migration: brain_dump_cache (for caching Brain Dump syntheses)
-- Stores cached Brain Dump results to avoid redundant AI calls
-- ============================

begin;

-- 1) Create brain_dump_cache table
create table if not exists public.brain_dump_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  scope_type text not null, -- 'global', 'folder', 'tag'
  scope_value text, -- folder name or tag name (null for global)
  content_hash text not null, -- hash of note IDs + updated_at timestamps
  synthesis jsonb not null, -- the cached Brain Dump result
  note_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Unique constraint on user + scope
  constraint unique_user_scope unique (user_id, scope_type, scope_value)
);

-- 2) Indexes
create index if not exists idx_brain_dump_cache_user_id on public.brain_dump_cache(user_id);
create index if not exists idx_brain_dump_cache_scope on public.brain_dump_cache(user_id, scope_type, scope_value);

-- 3) Enable RLS
alter table public.brain_dump_cache enable row level security;

-- 4) Create secure owner-only policies
drop policy if exists "Users can view own cache" on public.brain_dump_cache;
create policy "Users can view own cache"
on public.brain_dump_cache
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own cache" on public.brain_dump_cache;
create policy "Users can insert own cache"
on public.brain_dump_cache
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own cache" on public.brain_dump_cache;
create policy "Users can update own cache"
on public.brain_dump_cache
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cache" on public.brain_dump_cache;
create policy "Users can delete own cache"
on public.brain_dump_cache
for delete
using (auth.uid() = user_id);

-- 5) Grants
revoke all on public.brain_dump_cache from anon;
grant select, insert, update, delete on public.brain_dump_cache to authenticated;
grant all on public.brain_dump_cache to service_role;

-- 6) Updated_at trigger
drop trigger if exists trg_brain_dump_cache_updated_at on public.brain_dump_cache;
create trigger trg_brain_dump_cache_updated_at
before update on public.brain_dump_cache
for each row
execute function public.set_updated_at();

commit;
