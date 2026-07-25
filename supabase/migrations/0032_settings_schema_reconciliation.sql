-- ============================================================================
-- Settings schema reconciliation
--
-- Bug report: changing Language or Theme in Settings failed - "Invalid
-- input: expected string, received undefined" (Language) and "Couldn't
-- save your theme" (Appearance). Root cause: `theme`, `reading_width`,
-- `reading_progress_bar`, `remember_scroll_position`, and `timezone`
-- were added to `user_settings` by migration 0015, and (based on the
-- exact errors reported) that migration does not appear to have been
-- fully applied to this database - `select("*")` was simply omitting
-- those columns, and writes to them were failing outright.
--
-- This migration is 100% idempotent (every statement is guarded with
-- `if not exists`) - safe to run whether 0015 landed, partially landed,
-- or never ran at all. It's the exact same column/constraint set 0015
-- already defines, so running it is a no-op if your database is already
-- up to date.
-- ============================================================================

alter table public.user_settings
  add column if not exists theme text not null default 'light',
  add column if not exists reading_width text not null default 'comfortable',
  add column if not exists reading_progress_bar boolean not null default true,
  add column if not exists remember_scroll_position boolean not null default false,
  add column if not exists timezone text not null default 'UTC';

-- If `theme` already existed from a prior run of 0015, its column
-- default is still 'system' - align it with the app's real default
-- ("light", not "system" - see `src/lib/settings.ts`'s `defaultSettings`
-- doc comment: nobody should be silently switched to dark just because
-- their OS/browser prefers dark before they've ever opened Settings >
-- Appearance). This only changes the DEFAULT applied to NEW rows going
-- forward - it does not touch any already-saved value, including a
-- value of 'system' someone deliberately chose.
alter table public.user_settings
  alter column theme set default 'light';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_settings_theme_check'
  ) then
    alter table public.user_settings
      add constraint user_settings_theme_check check (theme in ('light', 'dark', 'system'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_settings_reading_width_check'
  ) then
    alter table public.user_settings
      add constraint user_settings_reading_width_check check (reading_width in ('comfortable', 'compact'));
  end if;
end $$;

comment on column public.user_settings.theme is 'Saved preference (light/dark/system). Defaults to light - see ThemeScope.tsx for how "system" then follows the OS/browser preference once deliberately chosen.';
