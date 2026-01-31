-- ============================
-- Migration: tags and folders tables
-- Stores tag/folder metadata (colors, starred status) in database
-- instead of localStorage for cross-device sync and iOS support
-- ============================

begin;

-- ============================================================
-- 1. Create tags table (stores metadata: name + color per user)
-- ============================================================
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  color text not null default 'slate',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint tags_user_name_unique unique(user_id, name)
);

-- ============================================================
-- 2. Create folders table (stores metadata: name + starred per user)
-- ============================================================
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  starred boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint folders_user_name_unique unique(user_id, name)
);

-- ============================================================
-- 3. Indexes
-- ============================================================
create index if not exists idx_tags_user_id on public.tags(user_id);
create index if not exists idx_tags_user_name on public.tags(user_id, name);
create index if not exists idx_folders_user_id on public.folders(user_id);
create index if not exists idx_folders_user_name on public.folders(user_id, name);
create index if not exists idx_folders_starred on public.folders(user_id, starred);

-- ============================================================
-- 4. Enable RLS
-- ============================================================
alter table public.tags enable row level security;
alter table public.folders enable row level security;

-- ============================================================
-- 5. RLS Policies for tags
-- ============================================================
drop policy if exists "Users can view own tags" on public.tags;
create policy "Users can view own tags"
on public.tags
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own tags" on public.tags;
create policy "Users can insert own tags"
on public.tags
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own tags" on public.tags;
create policy "Users can update own tags"
on public.tags
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tags" on public.tags;
create policy "Users can delete own tags"
on public.tags
for delete
using (auth.uid() = user_id);

-- ============================================================
-- 6. RLS Policies for folders
-- ============================================================
drop policy if exists "Users can view own folders" on public.folders;
create policy "Users can view own folders"
on public.folders
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own folders" on public.folders;
create policy "Users can insert own folders"
on public.folders
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own folders" on public.folders;
create policy "Users can update own folders"
on public.folders
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own folders" on public.folders;
create policy "Users can delete own folders"
on public.folders
for delete
using (auth.uid() = user_id);

-- ============================================================
-- 7. Grants
-- ============================================================
revoke all on public.tags from anon;
grant select, insert, update, delete on public.tags to authenticated;
grant all on public.tags to service_role;

revoke all on public.folders from anon;
grant select, insert, update, delete on public.folders to authenticated;
grant all on public.folders to service_role;

-- ============================================================
-- 8. Updated_at triggers (reuses existing set_updated_at function)
-- ============================================================
drop trigger if exists trg_tags_updated_at on public.tags;
create trigger trg_tags_updated_at
before update on public.tags
for each row
execute function public.set_updated_at();

drop trigger if exists trg_folders_updated_at on public.folders;
create trigger trg_folders_updated_at
before update on public.folders
for each row
execute function public.set_updated_at();

commit;
