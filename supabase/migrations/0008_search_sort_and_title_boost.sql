-- Virexa Full-Text Search - sortable results + stronger title-match ranking
--
-- Product polishing phase, area 6 ("SEARCH RELEVANCE") + area 1's "Keep
-- Sort (Most Relevant / Newest / Oldest)":
--   1. Exact/substring title matches now get an explicit rank boost on
--      top of the existing weighted tsvector rank, so a title match
--      reliably outranks a description-only or content-only match even
--      when ts_rank_cd's own weighting produces a close score.
--   2. `search_articles_fts()` gains a `sort_by` parameter
--      ('relevance' | 'newest' | 'oldest', default 'relevance') so the
--      public /search page's Sort control can actually change result
--      order instead of always sorting by rank.
--
-- Production safety:
--   - Wrapped in an explicit transaction.
--   - `create or replace function` restates the complete function body
--     (required by Postgres) - safe to paste and run again.
--   - Purely additive: one new trailing parameter (`sort_by text default
--     'relevance'`) with a default that preserves the exact previous
--     behavior (rank-ordered) for every existing caller. PostgREST/
--     `supabase-js`'s `.rpc()` calls Postgres functions with NAMED
--     parameters, so existing callers that never pass `sort_by` are
--     entirely unaffected.

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
        -- Explicit title-match boost ("Exact title matches should rank
        -- above description-only matches") - an exact title match gets
        -- the largest boost, a title that merely CONTAINS the whole
        -- query string as a substring gets a smaller one, on top of
        -- ts_rank_cd's own weighted score above.
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
  'Ranked, filtered, paginated, sortable full-text search across articles (title/description/tags/content/author/category), article_ai (summary/tldr), and article_sources (name). websearch_to_tsquery supports both word and phrase queries. Title matches get an explicit rank boost on top of weighted ts_rank_cd, so exact/substring title matches outrank description-only matches. sort_by (''relevance''|''newest''|''oldest'', default ''relevance'') controls result order; filter_category/filter_categories/filter_* are ANDed with the text match. Returns one row per match with a computed rank and matched_in field, plus a window-function total_count for pagination.';

commit;
