-- Virexa Full-Text Search
-- Adds real PostgreSQL full-text search over articles + their AI
-- enrichment + their source name (News Engine & Search production-
-- readiness phase). Run against a Supabase Postgres project (SQL
-- Editor or `supabase db push`), after 0001-0003.
-- Safe to re-run: every statement is guarded with IF NOT EXISTS /
-- OR REPLACE where Postgres supports it.
--
-- Design notes (why this shape):
--   - `articles.search_vector` is a GENERATED, STORED tsvector column
--     covering the fields that live directly on `articles` (title,
--     description, tags, content, author, category), weighted A/B/C so
--     a title match ranks above a content match ("Başlık eşleşmeleri
--     daha yüksek öncelikli olsun"). Postgres maintains it automatically
--     on every insert/update - no application code or trigger needed.
--   - `article_ai.summary`/`tldr` and `article_sources.name` live in
--     OTHER tables, so they can't be part of a generated column on
--     `articles` (Postgres generated columns can only reference columns
--     of the same row). Rather than denormalizing them onto `articles`
--     with sync triggers (real complexity for marginal benefit at this
--     app's scale), `search_articles_fts()` below joins to them at
--     query time and matches/ranks against expression-indexed
--     `to_tsvector(...)` calls on those columns directly - still a real,
--     indexed full-text match, not an ILIKE fallback.
--   - `tldr` is jsonb (`{ title, bullets }` - see `StoredTldr` in
--     `src/types/database.ts`); indexed/matched via `tldr::text` (a
--     full cast, JSON punctuation included) rather than reaching into
--     individual keys - `jsonb_array_elements_text` (needed to flatten
--     the `bullets` array) is a set-returning function and can't appear
--     in a scalar index expression. The small amount of stray
--     punctuation/braces this introduces into the indexed text is an
--     acceptable, documented tradeoff for a simple, valid expression
--     index instead of a second maintained column.

-- ============================================================================
-- articles.search_vector
-- ============================================================================

alter table public.articles
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(author, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C')
  ) stored;

create index if not exists articles_search_vector_idx
  on public.articles using gin (search_vector);

comment on column public.articles.search_vector is
  'Generated, GIN-indexed tsvector over title(A)/description(B)/tags(B)/content(C)/author(C)/category(C). Maintained automatically by Postgres. See search_articles_fts() for how AI summary/TLDR and source name (in other tables) are matched alongside this.';

-- ============================================================================
-- Expression indexes on article_ai / article_sources
-- Must match the expressions used inside search_articles_fts() below
-- exactly for the planner to actually use them.
-- ============================================================================

create index if not exists article_ai_search_idx
  on public.article_ai
  using gin (to_tsvector('english', coalesce(summary, '') || ' ' || coalesce(tldr::text, '')));

create index if not exists article_sources_name_search_idx
  on public.article_sources
  using gin (to_tsvector('english', coalesce(name, '')));

-- ============================================================================
-- search_articles_fts()
-- Ranked, filtered, paginated full-text search in one round trip.
-- `security invoker` (the default for `language sql` functions) - runs
-- with the calling role's own permissions, same as any other SELECT
-- through the public client. `articles`/`article_ai`/`article_sources`
-- all already grant public SELECT via RLS (0002_article_storage.sql),
-- so no new grants are needed for anon/authenticated to call this.
-- ============================================================================

create or replace function public.search_articles_fts(
  search_query text,
  filter_source_id text default null,
  filter_category text default null,
  filter_language text default null,
  filter_country text default null,
  filter_tag text default null,
  filter_date_from timestamptz default null,
  filter_date_to timestamptz default null,
  result_limit integer default 10,
  result_offset integer default 0
)
returns table (
  id text,
  slug text,
  title text,
  description text,
  content text,
  url text,
  image_url text,
  published_at timestamptz,
  language text,
  country text,
  category text,
  author text,
  tags text[],
  reading_time integer,
  trust_score integer,
  trending_score integer,
  source_id text,
  created_at timestamptz,
  updated_at timestamptz,
  rank real,
  matched_in text,
  total_count bigint
)
language sql
stable
as $$
  with q as (
    select websearch_to_tsquery('english', coalesce(search_query, '')) as tsq
  ),
  matched as (
    select
      a.id, a.slug, a.title, a.description, a.content, a.url, a.image_url,
      a.published_at, a.language, a.country, a.category, a.author, a.tags,
      a.reading_time, a.trust_score, a.trending_score, a.source_id,
      a.created_at, a.updated_at,
      (
        ts_rank_cd(a.search_vector, q.tsq) * 2.0
        + coalesce(ts_rank_cd(to_tsvector('english', coalesce(ai.summary, '') || ' ' || coalesce(ai.tldr::text, '')), q.tsq), 0) * 1.2
        + coalesce(ts_rank_cd(to_tsvector('english', coalesce(s.name, '')), q.tsq), 0) * 0.8
      ) as rank,
      case
        when to_tsvector('english', coalesce(a.title, '')) @@ q.tsq then 'title'
        when to_tsvector('english', coalesce(ai.summary, '') || ' ' || coalesce(ai.tldr::text, '')) @@ q.tsq then 'ai_summary'
        when to_tsvector('english', coalesce(a.description, '')) @@ q.tsq then 'description'
        when to_tsvector('english', coalesce(a.content, '')) @@ q.tsq then 'content'
        when to_tsvector('english', coalesce(array_to_string(a.tags, ' '), '')) @@ q.tsq then 'tags'
        when to_tsvector('english', coalesce(s.name, '')) @@ q.tsq then 'source'
        when to_tsvector('english', coalesce(a.author, '')) @@ q.tsq then 'author'
        when to_tsvector('english', coalesce(a.category, '')) @@ q.tsq then 'category'
        else 'other'
      end as matched_in
    from public.articles a
    cross join q
    left join public.article_ai ai on ai.article_id = a.id
    left join public.article_sources s on s.id = a.source_id
    where
      (
        a.search_vector @@ q.tsq
        or to_tsvector('english', coalesce(ai.summary, '') || ' ' || coalesce(ai.tldr::text, '')) @@ q.tsq
        or to_tsvector('english', coalesce(s.name, '')) @@ q.tsq
      )
      and (filter_source_id is null or a.source_id = filter_source_id)
      and (filter_category is null or a.category = filter_category)
      and (filter_language is null or a.language = filter_language)
      and (filter_country is null or a.country = filter_country)
      and (filter_tag is null or filter_tag = any(a.tags))
      and (filter_date_from is null or a.published_at >= filter_date_from)
      and (filter_date_to is null or a.published_at <= filter_date_to)
  )
  select
    id, slug, title, description, content, url, image_url, published_at,
    language, country, category, author, tags, reading_time, trust_score,
    trending_score, source_id, created_at, updated_at, rank, matched_in,
    count(*) over () as total_count
  from matched
  order by rank desc, published_at desc
  limit greatest(result_limit, 0)
  offset greatest(result_offset, 0);
$$;

comment on function public.search_articles_fts is
  'Ranked, filtered, paginated full-text search across articles (title/description/tags/content/author/category), article_ai (summary/tldr), and article_sources (name). websearch_to_tsquery supports both word and phrase queries ("Kelime veya cümle araması"). Returns one row per match with a computed rank and matched_in field, plus a window-function total_count for pagination.';
