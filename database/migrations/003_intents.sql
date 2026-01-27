-- ============================
-- Migration: intents table for Remy's Intent Flow
-- Stores user intents captured via explicit "Hey Remy" triggers
-- ============================

begin;

-- 1) Create intents table
create table if not exists public.intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  
  -- Content
  raw_text text not null,                    -- Original text from user
  normalized_intent text,                     -- AI-extracted normalized intent
  intent_type text default 'remember',        -- Type: remember, todo, decision, reminder
  
  -- Source reference
  source_type text not null,                  -- 'note', 'chat', 'recording'
  source_id uuid,                             -- Reference to note/recording if applicable
  source_title text,                          -- Title of source note
  
  -- Context at capture time
  context_scope text,                         -- 'global', 'folder', 'tag', 'note'
  context_value text,                         -- Folder name, tag name, or note ID
  
  -- Metadata
  tags text[] default '{}',                   -- Tags from context
  folder text,                                -- Folder from context
  
  -- Status
  status text default 'active',               -- 'active', 'completed', 'archived'
  completed_at timestamptz,
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Indexes
create index if not exists idx_intents_user_id on public.intents(user_id);
create index if not exists idx_intents_status on public.intents(user_id, status);
create index if not exists idx_intents_created on public.intents(user_id, created_at desc);
create index if not exists idx_intents_source on public.intents(source_id);

-- 3) Enable RLS
alter table public.intents enable row level security;

-- 4) Create secure owner-only policies
drop policy if exists "Users can view own intents" on public.intents;
create policy "Users can view own intents"
on public.intents
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own intents" on public.intents;
create policy "Users can insert own intents"
on public.intents
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own intents" on public.intents;
create policy "Users can update own intents"
on public.intents
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own intents" on public.intents;
create policy "Users can delete own intents"
on public.intents
for delete
using (auth.uid() = user_id);

-- 5) Grants
revoke all on public.intents from anon;
grant select, insert, update, delete on public.intents to authenticated;
grant all on public.intents to service_role;

-- 6) Updated_at trigger
drop trigger if exists trg_intents_updated_at on public.intents;
create trigger trg_intents_updated_at
before update on public.intents
for each row
execute function public.set_updated_at();

commit;
