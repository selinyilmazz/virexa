-- Diagnostic script: run this FIRST in the Supabase SQL Editor.
-- It only reads (no writes), so it's 100% safe to run anytime.
--
-- Why this exists: the Open Source page shows 0 repositories and the
-- Admin > Catalog Items page shows 0 items. Both pages' code paths are
-- correct and symmetric with working pages, so the most likely cause is
-- that migrations 0018 (repositories), 0022 (catalog_items), and/or 0023
-- (repositories_extended) were never actually run against this Supabase
-- project - this project applies migrations by pasting them into the SQL
-- Editor manually, not automatically.

-- 1) Do the tables exist at all?
select table_name,
       (table_name in (select table_name from information_schema.tables where table_schema = 'public')) as exists
from (values ('repositories'), ('catalog_items'), ('developer_releases')) as t(table_name);

-- 2) If they exist, how many rows do they actually have?
--    (run each separately if a table from step 1 doesn't exist yet - the
--    others will still error with "relation does not exist" otherwise)
select 'repositories' as table_name, count(*) as row_count from public.repositories;
select 'catalog_items' as table_name, count(*) as row_count from public.catalog_items;

-- 3) How many rows would the PUBLIC site actually see (RLS-filtered)?
--    This is the exact filter open-source-service.ts / developer-hub-service.ts
--    apply. If step 2's count is > 0 but this is 0, the problem is that
--    every row has visible = false (or archived = true) - not a missing
--    migration, just nothing marked visible yet.
select count(*) as public_visible_repositories
from public.repositories
where visible = true and archived = false;

select count(*) as public_visible_catalog_items
from public.catalog_items
where visible = true;

-- 4) Confirm RLS is enabled and the public select policy exists (both
--    should return exactly 1 row each).
select schemaname, tablename, rowsecurity
from pg_tables
where tablename in ('repositories', 'catalog_items');

select policyname, tablename, cmd, qual
from pg_policies
where tablename in ('repositories', 'catalog_items');

-- ============================================================
-- REMEDIATION - only do this if step 1 shows a table missing, or
-- step 2 shows 0 rows.
-- ============================================================
-- Open these three files from the project's supabase/migrations/ folder,
-- copy each one's FULL contents into the SQL Editor, and run them IN
-- THIS ORDER (each is safe to re-run - guarded with IF NOT EXISTS /
-- ON CONFLICT DO NOTHING, so re-running a migration that already applied
-- cleanly changes nothing):
--
--   1. supabase/migrations/0018_repositories.sql
--        -> creates `repositories`, enables RLS, seeds 12 real repos
--           (vercel/next.js, facebook/react, etc.) with stars/forks at 0
--           until you click "Sync from GitHub" in /admin/repositories.
--   2. supabase/migrations/0023_repositories_extended.sql
--        -> adds watchers/latest_release/archived columns + tightens RLS.
--   3. supabase/migrations/0022_catalog_items.sql
--        -> creates `catalog_items`, enables RLS, seeds ~40 real
--           certifications/courses/learning paths/tools/roadmaps/cheat
--           sheets (everything that used to live in the static
--           src/data/developer-hub.ts file).
--
-- After running these, re-run steps 1-4 above to confirm both tables
-- now show real row counts, then reload /open-source and
-- /admin/catalog-items - both should immediately show content (both
-- pages were already set to force-dynamic rendering, so no redeploy is
-- needed, just a page refresh).
