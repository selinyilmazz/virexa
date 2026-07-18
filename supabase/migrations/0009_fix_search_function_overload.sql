-- Virexa Full-Text Search - fix PGRST202 (function overload cleanup)
--
-- ============================================================================
-- ROOT CAUSE
-- ============================================================================
-- `search_articles_fts()` has been modified three times via
-- `create or replace function`:
--   0004_full_text_search.sql      -> 10 positional parameters
--   0007_search_multi_category.sql -> 11 positional parameters (added
--                                      filter_categories text[])
--   0008_search_sort_and_title_boost.sql -> 12 positional parameters
--                                      (added sort_by text)
--
-- `CREATE OR REPLACE FUNCTION` only ever replaces an EXISTING function
-- whose argument list (types, in order) is IDENTICAL to the one being
-- defined. In Postgres, a function's identity is its
-- (schema, name, parameter TYPE list) - argument names and default
-- values are not part of that identity. Every one of the three
-- migrations above changed the number of parameters, which means each
-- one has a DIFFERENT type-list identity from the one before it. So
-- none of them ever replaced the previous version - each
-- "create or replace" instead silently CREATED A NEW, ADDITIONAL
-- overload of `search_articles_fts`, stacking up alongside the old
-- ones still sitting in the database:
--   public.search_articles_fts(text, text, text, text, text, text,
--     timestamptz, timestamptz, integer, integer)                    -- 0004
--   public.search_articles_fts(text, text, text, text, text, text,
--     timestamptz, timestamptz, integer, integer, text[])            -- 0007
--   public.search_articles_fts(text, text, text, text, text, text,
--     timestamptz, timestamptz, integer, integer, text[], text)      -- 0008 (if applied)
--
-- `ArticleRepository.fullTextSearch()` calls `.rpc()` with ALL 12
-- named parameters, including `sort_by`. PostgREST resolves an RPC
-- call to a specific overload by matching the supplied parameter
-- NAMES against each candidate's parameter names. If the 0008 (12-arg)
-- overload was never created in this database at all - the most likely
-- explanation, since the error's "Perhaps you meant" hint shows
-- exactly the 0007 (11-arg, no sort_by) signature, i.e. the closest
-- thing PostgREST's schema cache actually has - then no candidate has
-- a `sort_by` parameter, PostgREST can't resolve the call, and it
-- fails with PGRST202. Even in a database where 0008 WAS run,
-- accumulating three overloads of the same function is exactly the
-- kind of state that produces fragile, hard-to-debug PostgREST
-- resolution errors going forward (PGRST202/PGRST203) as soon as any
-- future migration touches this function's signature again.
--
-- ============================================================================
-- FIX
-- ============================================================================
-- 1. Dynamically find and DROP every existing overload of
--    `public.search_articles_fts`, regardless of which of the three
--    (or more) historical signatures happens to be present in this
--    particular database - this makes the migration correct and
--    idempotent no matter whether 0008 was applied, partially applied,
--    or never applied at all.
-- 2. Recreate exactly ONE canonical `search_articles_fts`, with the
--    full 12-parameter signature (including `sort_by`) and the exact
--    same query body as 0008 - every existing feature (multi-category
--    filtering, title-match rank boost, sort_by) is preserved, nothing
--    is removed.
-- 3. Explicitly `notify pgrst, 'reload schema'` - Supabase's hosted
--    PostgREST normally auto-reloads its schema cache on DDL via an
--    event trigger, but issuing this directly removes any doubt/lag as
--    a possible cause and is Supabase's own documented fix for "my new
--    function isn't showing up yet."
--
-- Safe to re-run: the DROP loop is a no-op once nothing matches, and
-- `create or replace function` on the final, single 12-arg version is
-- idempotent from that point on.

begin;

do $$
declare
  overload record;
begin
  for overload in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'search_articles_fts'
  loop
    execute format('drop function %s', overload.signature);
  end loop;
end $$;

create function public.search_articles_fts(
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
  filter_categories text[] default null,
  sort_by text default 'relevance'
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
    select
      websearch_to_tsquery('english', coalesce(search_query, '')) as tsq,
      lower(trim(coalesce(search_query, ''))) as raw_query
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
        + case
            when q.raw_query <> '' and lower(a.title) = q.raw_query then 5.0
            when q.raw_query <> '' and lower(a.title) like '%' || q.raw_query || '%' then 1.5
            else 0
          end
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
  order by
    (case when sort_by = 'newest' then published_at end) desc nulls last,
    (case when sort_by = 'oldest' then published_at end) asc nulls last,
    rank desc,
    published_at desc
  limit greatest(result_limit, 0)
  offset greatest(result_offset, 0);
$$;

comment on function public.search_articles_fts is
  'Ranked, filtered, paginated, sortable full-text search across articles (title/description/tags/content/author/category), article_ai (summary/tldr), and article_sources (name). websearch_to_tsquery supports both word and phrase queries. Title matches get an explicit rank boost on top of weighted ts_rank_cd, so exact/substring title matches outrank description-only matches. sort_by (''relevance''|''newest''|''oldest'', default ''relevance'') controls result order; filter_category/filter_categories/filter_* are ANDed with the text match. Returns one row per match with a computed rank and matched_in field, plus a window-function total_count for pagination. This is the ONLY overload of this function - see migration 0009 for why 0004/0007/0008 each left a stray overload behind instead of replacing it.';

commit;

-- Explicit nudge for PostgREST's schema cache, in case the automatic
-- DDL-triggered reload lags in this environment (Supabase's own
-- documented workaround for "my new/changed function isn't visible to
-- the API yet"). Outside the transaction on purpose - NOTIFY takes
-- effect immediately either way, but keeping it separate from the DDL
-- transaction makes the ordering unambiguous.
notify pgrst, 'reload schema';
