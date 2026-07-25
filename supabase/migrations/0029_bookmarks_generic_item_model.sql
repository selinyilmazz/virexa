-- Unified Bookmark Center - the real production fix.
--
-- Confirmed against the live schema: `public.bookmarks` is still exactly
-- its original 0001 shape - id, user_id, article_slug, article_title,
-- article_description, article_image, article_category, article_source,
-- article_published_date, created_at. There is NO `item_type` column.
-- Migrations 0015 and 0028 (which assumed a generic `item_type`/
-- `item_meta` model already existed and only widened its check
-- constraint) were never actually applied here - the same
-- assumed-but-never-applied gap migration 0026 had to fix for
-- `repositories`. This migration does NOT build on 0015/0028's assumed
-- state. It upgrades the real, article-only production table in place:
-- every existing row is an article (the table has never supported
-- anything else), so every existing bookmark is preserved and explicitly
-- backfilled into the new generic shape, never dropped or reset.
--
-- New generic model: item_type, item_slug, item_title, item_description,
-- item_image, item_category, item_source, item_published_date, item_meta.
-- `item_slug`/`item_title`/etc. sit ALONGSIDE `article_slug`/
-- `article_title`/etc. for now, on purpose - articles, GitHub
-- repositories, courses, certifications and Developer Releases all read
-- and write the new generic columns from here on (the application code
-- was already updated to do so), but the legacy `article_*` columns are
-- deliberately NOT dropped in this pass. Safety requirement: this
-- migration must be completely backwards compatible, so any old
-- code/tooling/cached schema still expecting `article_*` keeps working
-- unmodified. Once the new columns have been verified in production,
-- drop the `article_*` columns in a separate, later cleanup migration.
--
-- Idempotent and safe to re-run at any point in this process: every `ADD
-- COLUMN`/constraint/index is existence-guarded, and the backfill only
-- ever touches rows that haven't been migrated yet (`where item_slug is
-- null` - never true again once a row has real item_* data, whether
-- backfilled by this migration or written fresh by the app afterward).

-- ============================================================================
-- 1) Add the generic columns - nullable at first, since existing rows
--    have no item_* values yet. `item_meta` gets its final shape
--    immediately since it has no legacy source column to backfill from.
-- ============================================================================

alter table public.bookmarks
  add column if not exists item_type text,
  add column if not exists item_slug text,
  add column if not exists item_title text,
  add column if not exists item_description text,
  add column if not exists item_image text,
  add column if not exists item_category text,
  add column if not exists item_source text,
  add column if not exists item_published_date text,
  add column if not exists item_meta jsonb not null default '{}'::jsonb;

-- ============================================================================
-- 2) Backfill every pre-existing row from its article_* data. The table
--    has only ever stored articles, so every row that hasn't been
--    migrated yet (`item_slug is null`) is unambiguously `item_type =
--    'article'`. Re-running this after a successful migration is a
--    harmless no-op - no row still has `item_slug is null` at that point.
-- ============================================================================

update public.bookmarks
set
  item_type = 'article',
  item_slug = article_slug,
  item_title = article_title,
  item_description = article_description,
  item_image = article_image,
  item_category = article_category,
  item_source = article_source,
  item_published_date = article_published_date
where item_slug is null;

-- ============================================================================
-- 3) Now that every existing row has real item_* values, lock in
--    defaults/NOT NULL for every row from here on. Re-applying an
--    already-set default/NOT NULL is a harmless no-op in Postgres, so
--    this block is safe to re-run unconditionally.
-- ============================================================================

alter table public.bookmarks
  alter column item_type set default 'article',
  alter column item_type set not null,
  alter column item_slug set not null,
  alter column item_title set default '',
  alter column item_title set not null,
  alter column item_description set default '',
  alter column item_description set not null,
  alter column item_image set default '',
  alter column item_image set not null,
  alter column item_category set default '',
  alter column item_category set not null,
  alter column item_source set default '',
  alter column item_source set not null,
  alter column item_published_date set default '',
  alter column item_published_date set not null;

-- ============================================================================
-- 4) item_type check constraint - every content type the unified
--    Bookmark Center supports (articles, GitHub repositories, courses,
--    certifications, Developer Releases), plus the forward-compatible
--    tutorial/resource slots 0015 originally reserved. Drop-and-recreate
--    is the only idempotent way to (re)define a `check` constraint in
--    Postgres.
-- ============================================================================

alter table public.bookmarks drop constraint if exists bookmarks_item_type_check;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookmarks_item_type_check'
  ) then
    alter table public.bookmarks
      add constraint bookmarks_item_type_check
      check (item_type in ('article', 'release', 'repository', 'course', 'certification', 'tutorial', 'resource'));
  end if;
end $$;

-- ============================================================================
-- 5) Uniqueness moves from (user_id, article_slug) to (user_id,
--    item_type, item_slug) - a release and an article could theoretically
--    share a slug string, and scoping by type rules that out. Drops both
--    the original 0001 constraint name and the name a prior partial run
--    of this migration (or 0015) might have already created, so this is
--    safe regardless of migration history.
-- ============================================================================

alter table public.bookmarks drop constraint if exists bookmarks_user_article_unique;
alter table public.bookmarks drop constraint if exists bookmarks_user_item_unique;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookmarks_user_item_unique'
  ) then
    alter table public.bookmarks
      add constraint bookmarks_user_item_unique unique (user_id, item_type, item_slug);
  end if;
end $$;

-- ============================================================================
-- 6) Index for per-item-type/slug lookups (e.g. a repository's or
--    course's real save count, `getCountsByItemType`) - mirrors the
--    existing per-user `(user_id, created_at)` index below.
-- ============================================================================

create index if not exists bookmarks_item_type_item_slug_idx
  on public.bookmarks (item_type, item_slug);

create index if not exists bookmarks_user_id_created_at_idx
  on public.bookmarks (user_id, created_at desc);

-- ============================================================================
-- 7) Backwards compatibility: the application no longer writes
--    `article_*` on insert (it writes `item_*` only - see
--    `bookmark-repository.ts`), but the original `article_slug` column
--    has no default and is `NOT NULL`, which would reject every new
--    bookmark row outright once that write path stops populating it.
--    Relaxing it to nullable is the one constraint change required to
--    keep the legacy columns around without blocking new writes; every
--    other `article_*` column already has a `default ''` from 0001, so
--    they're already safe to leave unpopulated. Dropping a `NOT NULL`
--    constraint is inherently idempotent - re-running this on an already-
--    nullable column is a no-op.
-- ============================================================================

alter table public.bookmarks
  alter column article_slug drop not null;

comment on table public.bookmarks is
  'Saved items per user (articles, releases, repositories, courses, certifications) via a generic item_* shape; unique per (user_id, item_type, item_slug). Legacy article_* columns (migration 0001) are kept, unpopulated, for backwards compatibility until a later cleanup migration drops them.';

comment on column public.bookmarks.item_type is
  'Discriminator for the unified Bookmark Center. See migration 0029 (the real production upgrade from the original article-only shape).';

comment on column public.bookmarks.item_slug is
  'Generic per-type slug/id - an article slug, a release''s technology slug, a repository''s owner/repo, or a catalog item''s row id.';

comment on column public.bookmarks.article_slug is
  'Legacy 0001 column, superseded by item_slug (migration 0029). No longer written by the application; kept only for backwards compatibility until a later cleanup migration drops it.';
