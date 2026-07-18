-- Reading history: real per-user "which articles did I actually open"
-- tracking, backing the Profile page's "Reading History" tab (product
-- polishing phase, 2nd pass). Distinct from `article_metrics.view_count`
-- (0002_article_storage.sql), which is a global, non-user-scoped counter -
-- this table is what lets a signed-in user see their OWN read history.
--
-- Denormalized article fields (article_slug/title/image/category/source),
-- same convention `bookmarks` already uses (0001_production_schema.sql) -
-- a history row still renders correctly even if the source article is
-- later removed from the news pipeline.
--
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR
-- REPLACE where Postgres supports it.

create table if not exists public.reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id uuid not null references public.articles (id) on delete cascade,
  article_slug text not null default '',
  article_title text not null default '',
  article_image text not null default '',
  article_category text not null default '',
  article_source text not null default '',
  read_at timestamptz not null default now(),
  constraint reading_history_user_article_unique unique (user_id, article_id)
);

-- Powers "most recent reads first" on the Profile tab, and the
-- per-user row count used for the summary header's "Read Articles" stat.
create index if not exists reading_history_user_id_read_at_idx
  on public.reading_history (user_id, read_at desc);

comment on table public.reading_history is
  'Per-user record of opened articles; unique per (user_id, article_id), read_at bumped on re-reads. Written by the service role only (see article-metrics-service.ts''s recordArticleRead), same convention as article_metrics writes.';

-- ============================================================================
-- Row Level Security
-- A user may only ever READ their own history rows. There is no
-- insert/update/delete policy for the `authenticated` role on purpose -
-- every write goes through the service-role client from a trusted
-- server-only code path (the article detail page already knows the
-- current session's user id server-side), the same pattern
-- `article_metrics` writes already use.
-- ============================================================================

alter table public.reading_history enable row level security;

drop policy if exists "reading_history_select_own" on public.reading_history;
create policy "reading_history_select_own"
  on public.reading_history for select
  using (auth.uid() = user_id);
