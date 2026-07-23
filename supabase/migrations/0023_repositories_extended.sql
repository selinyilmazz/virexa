-- Admin Panel: Repositories page fixes/extension
--
-- Extends `repositories` (0018) with the fields the Repositories admin
-- page needs to show real "Watchers" / "Latest Release" / "Archived"
-- data instead of just stars/forks - all populated from GitHub's own API
-- during sync (`repository-sync-service.ts`), never fabricated.
--
-- `archived` is a distinct concept from `visible`: `visible` controls
-- whether a repo appears on the public Open Source Explorer, `archived`
-- is an admin-side "soft remove from active management" flag (an
-- archived repo is also forced out of the public listing, but the two
-- are tracked separately so an admin can tell "hidden on purpose" apart
-- from "archived/retired").
--
-- Safe to re-run: guarded with IF NOT EXISTS.

alter table public.repositories add column if not exists watchers integer not null default 0;
alter table public.repositories add column if not exists latest_release_tag text;
alter table public.repositories add column if not exists latest_release_published_at timestamptz;
alter table public.repositories add column if not exists archived boolean not null default false;

create index if not exists repositories_archived_idx on public.repositories (archived);

-- An archived repo should never appear on the public site, regardless of
-- `visible` - tightens the existing "visible = true" policy rather than
-- replacing it.
drop policy if exists "repositories_select_visible" on public.repositories;
create policy "repositories_select_visible"
  on public.repositories for select
  using (visible = true and archived = false);
