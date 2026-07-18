-- Virexa - discussion_url + image_source columns
--
-- ============================================================================
-- 1. discussion_url (Hacker News link bug fix)
-- ============================================================================
-- Root cause: `articles` had exactly ONE url column. Every provider
-- (RSS/NewsAPI/GNews/HackerNews) writes its article's own destination link
-- into it, which is correct for RSS/NewsAPI/GNews - but Hacker News stories
-- often link to a third-party page (including, sometimes, a Reddit thread)
-- as their `item.url`, while the actual Hacker News discussion always lives
-- at a separate, permanent `https://news.ycombinator.com/item?id=<id>` page
-- that was never captured anywhere. The public article page always labels
-- its single source link with the source's name ("Hacker News") but pointed
-- it at `url` - so a Hacker News-labeled link could open whatever external
-- site (e.g. old.reddit.com) the story happened to link to, not Hacker
-- News's own discussion thread.
--
-- Fix: a dedicated, nullable `discussion_url` column, populated only by
-- providers that have a genuine discussion/comments page distinct from the
-- article's own link (currently only HackerNewsProvider, which now always
-- sets it to the story's permanent news.ycombinator.com/item?id=<id> URL).
-- Every other provider leaves it null. The read layer prefers
-- `discussion_url` when present, falling back to `url` unchanged for every
-- non-Hacker-News article - see `services/articles/article-read-service.ts`
-- and `services/admin/admin-article-service.ts`.
--
-- ============================================================================
-- 2. image_source (image fallback pipeline observability)
-- ============================================================================
-- New column recording which stage of the image-resolution pipeline
-- actually supplied `image_url` for this article - 'provider' (the
-- source's own feed/API image, including any og:image already merged in
-- upstream by that provider) | 'stock:pexels' | 'stock:unsplash' |
-- 'stock:pixabay' | 'stock:wikimedia' | 'placeholder'. Purely observability
-- (drives an Admin Articles column and
-- makes "why does this article have this image" answerable without reading
-- code) - nothing reads this to make a decision, so it's safe to add as a
-- nullable, unindexed column with no backfill required for existing rows.
--
-- Both are plain additive columns - safe to run against an existing
-- database (nothing is dropped or renamed) and safe on a fresh database
-- (this migration runs once, in order, after 0002_article_storage.sql).

alter table public.articles add column if not exists discussion_url text;
alter table public.articles add column if not exists image_source text;

comment on column public.articles.discussion_url is
  'Optional discussion/comments page URL, distinct from the article''s own url column - currently only populated by HackerNewsProvider (always https://news.ycombinator.com/item?id=<id>). Null for every other provider. Preferred over url by the read layer when rendering the "Source" link, so a Hacker News-labeled link always opens Hacker News''s own discussion thread instead of whatever external site the story happens to link to.';

comment on column public.articles.image_source is
  'Which stage of the image-resolution pipeline supplied image_url: provider (the source''s own feed/API image, including any og:image already merged in upstream by that provider) | stock:pexels | stock:unsplash | stock:pixabay | stock:wikimedia | placeholder. Observability only - see lib/news/stock-image-provider.ts and services/news/news-aggregator.ts.';
