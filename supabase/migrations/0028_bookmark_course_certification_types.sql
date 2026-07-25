-- Unified Bookmark Center: extend `bookmarks.item_type` to cover Courses
-- and Certifications, so every save action across the platform (articles,
-- GitHub repositories, courses, certifications, Developer Releases) uses
-- the exact same `bookmarks` table/columns migration 0015 already built -
-- no new table, no separate storage system.
--
-- 'course' / 'certification' deliberately match the existing
-- `catalog_items.resource_type` naming (`CatalogResourceTypeDb`, see
-- migration 0022) rather than inventing new labels, so a catalog item's
-- own `resource_type` and its bookmark's `item_type` always read the same
-- word. 'tutorial'/'resource' stay in the constraint (still no producer,
-- same forward-compatible convention 0015 established).
--
-- Idempotent: guarded by a `pg_constraint` existence check, safe to re-run.

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

comment on table public.bookmarks is
  'Saved items per user (articles, releases, repositories, courses, certifications); unique per (user_id, item_type, article_slug). article_slug doubles as the generic item slug for non-article types.';

comment on column public.bookmarks.item_type is
  'Discriminator for the unified Bookmark Center. See migration 0015 (article/release/repository) and 0028 (course/certification).';
