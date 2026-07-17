-- Virexa production database schema - Article Storage layer
-- Tables: article_sources, articles, article_ai, article_metrics
-- Run against a Supabase Postgres project (SQL Editor or `supabase db push`),
-- after 0001_production_schema.sql. Safe to re-run: every statement is
-- guarded with IF NOT EXISTS / OR REPLACE where Postgres supports it.
--
-- Writes to every table below are server-only (see the RLS section at the
-- bottom): only Virexa's Runtime layer, using the Supabase service role
-- key (src/lib/supabase/service-client.ts), can insert/update/delete.
-- Reads are public - these tables back news content, not user data.

-- ============================================================================
-- article_sources
-- One row per publisher (BBC, Reuters, TechCrunch, ...). `id` reuses the
-- same stable string key already used throughout the news engine
-- (`SOURCES` in src/lib/news/sources.ts, e.g. "techcrunch", "the-verge"),
-- so upserting a source is always a natural-key operation - no separate
-- surrogate id/lookup table needed.
-- ============================================================================

create table if not exists public.article_sources (
  id text primary key,
  name text not null,
  domain text not null default '',
  logo text,
  official boolean not null default false,
  country text not null default '',
  trust_score integer not null default 0
    constraint article_sources_trust_score_range check (trust_score between 0 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.article_sources is 'One row per news publisher; id matches src/lib/news/sources.ts SOURCES keys.';

-- ============================================================================
-- articles
-- One row per normalized news article. `id` reuses the same deterministic
-- id the news engine already computes (`buildArticleId(source.id, slug)`
-- in src/lib/news/slug.ts) - re-fetching the same story naturally upserts
-- the same row instead of creating a duplicate, which is the first line
-- of defense for duplicate prevention (see ArticleRepository.bulkUpsert
-- for the second: a url/slug lookup that remaps a candidate onto an
-- existing row's id before the upsert, in case two different ids ever
-- resolve to the same story).
-- ============================================================================

create table if not exists public.articles (
  id text primary key,
  slug text not null,
  title text not null,
  description text not null default '',
  content text,
  url text not null,
  image_url text not null default '',
  published_at timestamptz not null,
  language text not null default 'en',
  country text not null default '',
  category text not null,
  author text,
  tags text[] not null default '{}',
  reading_time integer not null default 1,
  trust_score integer not null default 0
    constraint articles_trust_score_range check (trust_score between 0 and 100),
  trending_score integer not null default 0,
  source_id text not null references public.article_sources (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_url_unique unique (url),
  constraint articles_slug_unique unique (slug)
);

create index if not exists articles_category_idx on public.articles (category);
create index if not exists articles_published_at_idx on public.articles (published_at desc);
create index if not exists articles_source_id_idx on public.articles (source_id);
create index if not exists articles_trending_score_idx on public.articles (trending_score desc);
create index if not exists articles_language_idx on public.articles (language);
create index if not exists articles_country_idx on public.articles (country);
create index if not exists articles_tags_gin_idx on public.articles using gin (tags);
-- Case-insensitive title search (ILIKE '%term%') benefits from trigram,
-- but that requires the pg_trgm extension; a plain lower(title) index
-- still helps prefix/equality lookups without an extra extension
-- dependency for this task.
create index if not exists articles_title_lower_idx on public.articles (lower(title));

comment on table public.articles is 'Persisted, normalized news articles - the production-storage counterpart to the in-memory live-articles cache (src/services/news/live-articles.ts).';

-- ============================================================================
-- article_ai
-- AI-generated enrichment, kept in its own table (never merged into
-- `articles`) - one row per (article, content hash, provider). A content
-- change (article edited/re-fetched with different text) or a provider
-- switch produces a NEW `cache_key`, hence a NEW row: old AI output is
-- never overwritten, which is the versioning behavior requested ("Yeni AI
-- üretildiyse eski kayıt overwrite edilmesin"). Re-running AI for
-- unchanged content on the same provider hits the same `cache_key` and
-- upserts in place (idempotent retry), rather than growing without bound.
-- ============================================================================

create table if not exists public.article_ai (
  id uuid primary key default gen_random_uuid(),
  article_id text not null references public.articles (id) on delete cascade,
  summary text,
  tldr jsonb,
  tags text[] not null default '{}',
  sentiment jsonb,
  bias jsonb,
  provider text not null,
  model text not null default '',
  prompt_version text not null default '',
  generated_at timestamptz not null default now(),
  -- Content-hash of the article at generation time (see
  -- src/lib/ai/content-hash.ts) - this IS the version key: same hash +
  -- same provider = same row (idempotent), different hash = a new,
  -- separately-preserved version.
  cache_key text not null,
  created_at timestamptz not null default now(),
  constraint article_ai_version_unique unique (article_id, provider, cache_key)
);

create index if not exists article_ai_article_id_idx on public.article_ai (article_id, generated_at desc);

comment on table public.article_ai is 'Versioned AI enrichment per article - one row per (article, provider, content hash); never overwritten in place across content changes.';

-- ============================================================================
-- article_metrics
-- One row per article, same 1:1 shape as profiles/user_settings in
-- 0001_production_schema.sql. Created once (with zeroed counters) the
-- first time an article is persisted and never reset afterward by the
-- news/runtime pipeline - only a future view/bookmark/share-tracking
-- feature (out of scope for this task) would increment these.
-- ============================================================================

create table if not exists public.article_metrics (
  article_id text primary key references public.articles (id) on delete cascade,
  view_count bigint not null default 0,
  bookmark_count bigint not null default 0,
  share_count bigint not null default 0,
  click_count bigint not null default 0,
  reading_time_avg numeric(6, 2) not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.article_metrics is 'Engagement counters per article - initialized to zero on article insert, incremented elsewhere (not by the ingestion pipeline).';

-- ============================================================================
-- updated_at triggers
-- Reuses public.set_updated_at(), already defined in
-- 0001_production_schema.sql - no need to redefine it here.
-- ============================================================================

drop trigger if exists set_updated_at on public.article_sources;
create trigger set_updated_at
  before update on public.article_sources
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.articles;
create trigger set_updated_at
  before update on public.articles
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.article_metrics;
create trigger set_updated_at
  before update on public.article_metrics
  for each row
  execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- Public read on all four tables (this is news content, not user data);
-- no insert/update/delete policy is defined for anon/authenticated on any
-- of them, so ordinary clients have zero write access. Only Virexa's
-- Runtime layer, authenticated via the Supabase service role key (which
-- bypasses RLS entirely by design), can write - see
-- src/lib/supabase/service-client.ts.
-- ============================================================================

alter table public.article_sources enable row level security;
alter table public.articles enable row level security;
alter table public.article_ai enable row level security;
alter table public.article_metrics enable row level security;

drop policy if exists "article_sources_select_all" on public.article_sources;
create policy "article_sources_select_all"
  on public.article_sources for select
  using (true);

drop policy if exists "articles_select_all" on public.articles;
create policy "articles_select_all"
  on public.articles for select
  using (true);

drop policy if exists "article_ai_select_all" on public.article_ai;
create policy "article_ai_select_all"
  on public.article_ai for select
  using (true);

drop policy if exists "article_metrics_select_all" on public.article_metrics;
create policy "article_metrics_select_all"
  on public.article_metrics for select
  using (true);
