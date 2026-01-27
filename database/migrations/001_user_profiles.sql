-- ============================
-- Migration: user_profiles (safe + production-ready)
-- Keeps SAME table/column names.
-- Adds: proper UUID default, FK to auth.users, secure RLS, safer grants, updated_at trigger.
-- ============================

begin;

-- 0) Ensure required extension for gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) Create table (same schema you had, but safer defaults)
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null,
  full_name text,
  email text,
  onboarding_completed boolean default false,
  usage_preferences text[] default '{}',
  ai_style_preferences text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Index (same as yours)
create index if not exists idx_user_profiles_user_id on public.user_profiles(user_id);

-- 3) Foreign key to Supabase Auth (prevents orphan profiles; optional cascade cleanup)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_user_id_fkey'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
      add constraint user_profiles_user_id_fkey
      foreign key (user_id)
      references auth.users(id)
      on delete cascade;
  end if;
end $$;

-- 4) Enable RLS
alter table public.user_profiles enable row level security;

-- 5) Remove your wide-open policy (if it exists)
drop policy if exists "Allow all operations on user_profiles" on public.user_profiles;

-- 6) Create secure owner-only policies (idempotent)
drop policy if exists "Users can view own profile" on public.user_profiles;
create policy "Users can view own profile"
on public.user_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
on public.user_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
on public.user_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own profile" on public.user_profiles;
create policy "Users can delete own profile"
on public.user_profiles
for delete
using (auth.uid() = user_id);

-- 7) Safer grants (no public write access)
revoke all on public.user_profiles from anon;
grant select, insert, update, delete on public.user_profiles to authenticated;
grant all on public.user_profiles to service_role;

-- 8) updated_at auto-update trigger (safe to re-run)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

commit;
