-- Authenticated UX redesign: multi-type bookmarks + expanded user settings.
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE
-- where Postgres supports it.

-- ============================================================================
-- bookmarks: item_type + item_meta
-- Every bookmark row was implicitly an article before this migration. The
-- redesigned Bookmarks page ("personal Developer Reading Library") also
-- supports saving Developer Releases and GitHub repositories, so a bookmark
-- now carries its own `item_type` alongside the existing denormalized
-- `article_*` fields, which double as the generic item's own display fields
-- regardless of type (renaming them would be a bigger, riskier migration for
-- no functional gain - see `bookmark-repository.ts`'s doc comment).
-- `item_meta` is a free-form jsonb bag for type-specific extras (a release's
-- version/logo key, a repository's stars/language/url) that don't fit the
-- article-shaped columns. `tutorial`/`resource` are included in the type
-- constraint for forward-compatibility even though nothing produces them yet
-- (same "additive capability, never fabricated content" convention as
-- `ArticleContentBlock`'s image/table/code variants).
-- ============================================================================

alter table public.bookmarks
  add column if not exists item_type text not null default 'article',
  add column if not exists item_meta jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookmarks_item_type_check'
  ) then
    alter table public.bookmarks
      add constraint bookmarks_item_type_check
      check (item_type in ('article', 'release', 'repository', 'tutorial', 'resource'));
  end if;
end $$;

-- Replaces the old (user_id, article_slug) uniqueness with (user_id,
-- item_type, article_slug) - a release and an article could theoretically
-- share a slug string, and this scopes the constraint by type to rule that
-- out.
alter table public.bookmarks drop constraint if exists bookmarks_user_article_unique;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookmarks_user_item_unique'
  ) then
    alter table public.bookmarks
      add constraint bookmarks_user_item_unique unique (user_id, item_type, article_slug);
  end if;
end $$;

comment on table public.bookmarks is
  'Saved items per user (articles, releases, repositories); unique per (user_id, item_type, article_slug). article_slug doubles as the generic item slug for non-article types.';

-- ============================================================================
-- user_settings: Reading + Appearance + expanded Notifications
-- ============================================================================

alter table public.user_settings
  add column if not exists theme text not null default 'system',
  add column if not exists reading_width text not null default 'comfortable',
  add column if not exists reading_progress_bar boolean not null default true,
  add column if not exists remember_scroll_position boolean not null default false,
  add column if not exists timezone text not null default 'UTC';

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

comment on column public.user_settings.theme is 'Saved preference only (light/dark/system) - Virexa has no dark theme implemented app-wide yet; see HeaderThemeToggle.tsx.';
