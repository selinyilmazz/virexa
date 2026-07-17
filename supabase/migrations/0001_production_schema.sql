-- Virexa production database schema
-- Tables: profiles, bookmarks, user_settings
-- Run against a Supabase Postgres project (SQL Editor or `supabase db push`).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE
-- where Postgres supports it.

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================================
-- profiles
-- One row per auth user. Primary key IS the auth user id (1:1), so there is
-- no separate surrogate id/foreign key pair to keep in sync.
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  username text not null default '',
  bio text not null default '',
  country text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) <= 32),
  constraint profiles_bio_length check (char_length(bio) <= 500)
);

-- Usernames are optional (default ''), but when set must be unique.
-- A partial unique index (rather than a plain UNIQUE constraint) lets
-- every user leave username blank without colliding on ''.
create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username <> '';

comment on table public.profiles is 'One row per authenticated user; id = auth.users.id.';

-- ============================================================================
-- bookmarks
-- Many rows per user, one per saved article. Denormalized article fields are
-- stored directly (article_*) so a bookmark still renders correctly even if
-- the source article later disappears from the news pipeline/mock data.
-- ============================================================================

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_slug text not null,
  article_title text not null default '',
  article_description text not null default '',
  article_image text not null default '',
  article_category text not null default '',
  article_source text not null default '',
  article_published_date text not null default '',
  created_at timestamptz not null default now(),
  constraint bookmarks_user_article_unique unique (user_id, article_slug)
);

create index if not exists bookmarks_user_id_created_at_idx
  on public.bookmarks (user_id, created_at desc);

comment on table public.bookmarks is 'Saved articles per user; unique per (user_id, article_slug).';

-- ============================================================================
-- user_settings
-- One row per auth user, same 1:1 shape as profiles.
-- ============================================================================

create table if not exists public.user_settings (
  id uuid primary key references auth.users (id) on delete cascade,
  dark_mode boolean not null default false,
  language text not null default 'en',
  summary_length text not null default 'medium'
    constraint user_settings_summary_length_check check (summary_length in ('short', 'medium', 'long')),
  preferred_categories text[] not null default array['Technology', 'AI'],
  notifications jsonb not null default '{"email": true, "push": false, "weeklyDigest": true}'::jsonb,
  email_preferences jsonb not null default
    '{"productUpdates": true, "marketingEmails": false, "accountActivity": true}'::jsonb,
  privacy jsonb not null default '{"publicProfile": true, "showReadingActivity": false}'::jsonb,
  auto_play_videos boolean not null default false,
  compact_view boolean not null default false,
  open_links_in_new_tab boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_settings is 'One row per authenticated user; id = auth.users.id.';

-- ============================================================================
-- updated_at trigger
-- Shared by every table that has an updated_at column.
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.user_settings;
create trigger set_updated_at
  before update on public.user_settings
  for each row
  execute function public.set_updated_at();

-- ============================================================================
-- Auto-provision profile + settings rows on signup
-- Mirrors what src/lib/profile.ts / src/lib/settings.ts used to synthesize
-- client-side as "defaults" - now a real row exists from the moment the
-- user signs up, so every read is a plain SELECT with no upsert-on-read
-- special case required.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;

  insert into public.user_settings (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- Every table: a user may only read/write their own row(s).
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.bookmarks enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own"
  on public.bookmarks for select
  using (auth.uid() = user_id);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own"
  on public.bookmarks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
  on public.user_settings for select
  using (auth.uid() = id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
  on public.user_settings for insert
  with check (auth.uid() = id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
  on public.user_settings for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own"
  on public.user_settings for delete
  using (auth.uid() = id);
