-- Diagnostic script for the "Mobile Games shows 0 articles even after
-- backfill" investigation. Read-only - safe to run anytime.
--
-- Run each numbered block in the Supabase SQL Editor and note the results.
-- Code-level investigation (category-mapper.ts, feed-sources.ts,
-- article-repository.ts, ExplorerView.tsx) has already confirmed:
--   - The classifier's category constant is the literal string "Mobile Games".
--   - articles.category is a plain `text` column, no enum - stores whatever
--     string is written, byte for byte.
--   - The Mobile Games page (/category/mobile-games) resolves the slug to
--     the exact same "Mobile Games" string (see SEARCH_CATEGORY_SLUGS in
--     category-mapper.ts) and queries `articles.search()`, which runs
--     `.in("category", ["Mobile Games"])` - a plain, correct exact-match
--     filter. No string-mismatch bug exists in this path.
--   - backfillArticleCategories() really executes `UPDATE articles SET
--     category = ... WHERE id = ...` (identical pattern to the
--     Trust/Trending/Image backfills you already confirmed work) - it is
--     not a dry run.
-- So the remaining open question is purely a DATA question: does any
-- stored article's TITLE ever contain one of the ~24 Mobile-Games-specific
-- phrases the classifier looks for? These queries answer that directly.

-- 1) Exact counts (answers investigation item 1).
select category, count(*) as row_count
from public.articles
where category in ('Games', 'Mobile Games')
group by category;

-- 2) Sample rows for both (answers investigation item 2).
select id, title, category, published_at
from public.articles
where category = 'Games'
order by published_at desc
limit 15;

select id, title, category, published_at
from public.articles
where category = 'Mobile Games'
order by published_at desc
limit 15;

-- 3) Byte-exact check of every distinct category string actually stored -
-- rules out a whitespace/casing mismatch definitively (answers item 3).
select category, length(category) as char_length, count(*) as row_count
from public.articles
group by category
order by category;

-- 4) THE KEY QUERY: does any article title even contain mobile+game(s)
-- wording at all, regardless of what category it currently landed in?
-- If this returns 0 rows, the root cause is fully confirmed: no ingested
-- article has ever had mobile-gaming content in its title, so no keyword
-- list (however expanded) can ever classify anything as "Mobile Games" -
-- this is a source-coverage gap (see feed-sources.ts: the only enabled
-- "Games" feeds are IGN and Polygon, both general console/PC gaming
-- outlets; no feed anywhere in the registry, enabled or disabled, is a
-- mobile-games trade publication), not a classifier bug.
-- If this DOES return rows, look at what category column they landed in -
-- that tells you exactly which of the classifier's Mobile Games alias
-- phrases is too narrow to match real headlines.
select id, title, category, published_at
from public.articles
where title ilike '%mobile%' and (title ilike '%game%' or title ilike '%gaming%')
order by published_at desc;

-- 5) Broader sanity check: same query but for the actual alias phrases
-- the classifier looks for (hyper-casual, gacha, liveops, app store,
-- google play, android games, ios games, mobile esports) - if #4 is empty
-- this will also be empty, but run it anyway for a complete picture.
select id, title, category, published_at
from public.articles
where title ilike '%hyper-casual%'
   or title ilike '%hypercasual%'
   or title ilike '%gacha%'
   or title ilike '%liveops%'
   or title ilike '%live ops%'
   or title ilike '%app store%'
   or title ilike '%google play%'
   or title ilike '%android game%'
   or title ilike '%ios game%'
   or title ilike '%mobile esports%'
   or title ilike '%mobile gaming%'
   or title ilike '%mobile studio%'
order by published_at desc;
