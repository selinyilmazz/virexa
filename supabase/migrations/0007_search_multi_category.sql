-- Virexa Full-Text Search - multi-category filtering
--
-- Bug this fixes: the public /search page's Category filter is a
-- multi-select checkbox list (Technology, AI, Games, Business, World,
-- Science, Security, Startup), but `search_articles_fts()`
-- (0004_full_text_search.sql) only ever accepted a single
-- `filter_category text` value. The application layer silently applied
-- only the FIRST selected category and dropped every other checked
-- box - selecting "AI" + "Games" together quietly behaved exactly like
-- selecting only "AI". This migration adds real multi-category
-- filtering at the database layer so every checked category is honored.
--
-- Production safety:
--   - Wrapped in an explicit transaction.
--   - `create or replace function` restates the complete function body
--     (required by Postgres for `create or replace`) - safe to paste
--     and run again.
--   - Purely additive: adds ONE new trailing parameter
--     (`filter_categories text[] default null`) with a default that
--     preserves the exact previous behavior for every existing caller.
--     PostgREST/`supabase-js`'s `.rpc()` calls Postgres functions with
--     NAMED parameters (not positional), so existing callers that only
--     ever pass `filter_category` (singular) are entirely unaffected -
--     `filter_categories` (plural) simply defaults to null for them,
--     which is a no-op in the WHERE clause below.
--   - The existing `filter_category text` (singular) parameter is left
--     completely untouched for backward compatibility - both filters
--     can be supplied at once (ANDed) if a future caller ever wants to,
--     though the application layer today only ever uses one or the
--     other.

begin;

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
  result_offset integer default 0,
  filter_categories text[] default null
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
      and (filter_categories is null or a.category = any(filter_categories))
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
  'Ranked, filtered, paginated full-text search across articles (title/description/tags/content/author/category), article_ai (summary/tldr), and article_sources (name). websearch_to_tsquery supports both word and phrase queries. filter_category (single) and filter_categories (array, added 0007) can both be used - the app passes whichever matches how many categories are checked in the UI. Returns one row per match with a computed rank and matched_in field, plus a window-function total_count for pagination.';

commit;
