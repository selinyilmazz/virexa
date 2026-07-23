-- Navigation/Profile/Settings/Search UX update:
--   1. `reading_history` gains a denormalized `article_reading_time` column
--      (same convention as `article_slug`/`article_title`/etc. - a history
--      row still renders correctly even if the source article is later
--      removed) so the new standalone Reading History page can show a
--      real reading-time badge and "Continue Reading" affordance per row,
--      matching the same field the Bookmarks cards already display.
--   2. `notifications` gains two new real, saved preference keys:
--      `bookmarkReminders` and `developerHubUpdates` (Settings redesign's
--      Notifications category). Existing `developerReleases` key is kept
--      as-is (Settings UI now just labels it "Release Notifications").
--   3. `privacy` (added in 0001 but never wired into the app until now)
--      is redefined to the real fields the redesigned Settings "Privacy"
--      category needs: `profileVisibility`, `analyticsConsent`,
--      `personalizedRecommendations`, `trackSearchHistory`,
--      `trackReadingHistory`. The two old placeholder keys
--      (`publicProfile`/`showReadingActivity`) were never read or written
--      by any code path, so this is a clean redefinition, not a breaking
--      change for real data.
--
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR
-- REPLACE where Postgres supports it. jsonb columns are schemaless, so
-- existing rows simply keep their old keys until next saved from the
-- Settings page - `src/repositories/settings-repository.ts` merges saved
-- values over app-level defaults so a row missing a brand-new key never
-- breaks the UI.

alter table public.reading_history
  add column if not exists article_reading_time text not null default '';

alter table public.user_settings
  alter column notifications set default
    '{"email": true, "push": false, "weeklyDigest": true, "breakingNews": true, "developerReleases": true, "securityAlerts": true, "dailyDigest": false, "bookmarkReminders": true, "developerHubUpdates": false}'::jsonb,
  alter column privacy set default
    '{"profileVisibility": "private", "analyticsConsent": true, "personalizedRecommendations": true, "trackSearchHistory": true, "trackReadingHistory": true}'::jsonb;

comment on column public.user_settings.privacy is 'Real, saved privacy preferences (profileVisibility/analyticsConsent/personalizedRecommendations/trackSearchHistory/trackReadingHistory) - see Settings page Privacy category.';
comment on column public.reading_history.article_reading_time is 'Denormalized display string (e.g. "5 min read") captured at read time - same convention as the other article_* columns on this table.';
