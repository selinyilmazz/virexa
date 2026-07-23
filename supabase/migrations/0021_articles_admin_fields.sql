-- Admin Panel: Articles full CMS editor (requirement 5) - adds the
-- three admin-editorial columns the existing `articles` table (see
-- 0002_article_storage.sql) has no equivalent for:
--   - subtitle: short standalone dek, distinct from `description`
--     (used elsewhere as the card/summary blurb).
--   - featured: manual editorial override, additive alongside the
--     existing algorithmic `trending_score` - does not replace it.
--   - visible: publish/unpublish status. Defaults to true so every
--     already-ingested article stays exactly as visible as it is today;
--     this migration changes no existing behavior on its own.
--
-- No RLS changes needed - `articles` already has a public `select`
-- policy and no insert/update/delete policy for anon/authenticated (see
-- 0002_article_storage.sql's RLS section), so these new columns are
-- writable only via the service-role client, same as every other
-- column on this table.
--
-- Safe to re-run: every statement is guarded.

alter table public.articles
  add column if not exists subtitle text not null default '',
  add column if not exists featured boolean not null default false,
  add column if not exists visible boolean not null default true;

create index if not exists articles_featured_idx on public.articles (featured) where featured = true;
