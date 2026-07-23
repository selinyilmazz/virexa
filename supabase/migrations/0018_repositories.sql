-- Admin Panel: Repositories management
--
-- Open Source Explorer repos previously came ONLY from a live GitHub API
-- call over a fixed in-code list (`TRACKED_REPOS` in
-- src/lib/developer-hub/github.ts) - nothing an admin could add, remove,
-- or edit from a UI. This table becomes the new source of truth: the
-- public Open Source Explorer reads from here (filtered to
-- `visible = true`), and `/admin/repositories` gets real CRUD.
--
-- `stars`/`forks`/`language`/`license`/`description`/`topics` can still
-- be refreshed from GitHub's live API on demand (see
-- `services/open-source/repository-sync-service.ts`) - `auto_sync`
-- controls whether that refresh is allowed to overwrite a row an admin
-- has since hand-edited (set to `false` automatically the moment an
-- admin saves a manual edit to one of those fields), so admin intent is
-- never silently clobbered by the next sync.
--
-- Safe to re-run: guarded with IF NOT EXISTS / OR REPLACE / ON CONFLICT.

create table if not exists public.repositories (
  -- "owner/repo" (GitHub's own full_name) - stable, unique, matches the
  -- id/slug already used for repository bookmarks (item_meta jsonb on
  -- the bookmarks table), so no separate id scheme to reconcile.
  id text primary key,
  owner text not null,
  repo_name text not null,
  description text not null default '',
  language text,
  license text,
  stars integer not null default 0,
  forks integer not null default 0,
  github_url text not null,
  topics text[] not null default '{}',
  repo_created_at timestamptz,
  featured boolean not null default false,
  trending boolean not null default false,
  visible boolean not null default true,
  -- When true, the GitHub sync job may overwrite description/language/
  -- license/stars/forks/topics/repo_created_at. Set to false the moment
  -- an admin manually edits any of those fields (see
  -- admin-repository-service.ts's updateRepository()).
  auto_sync boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists repositories_visible_idx on public.repositories (visible);
create index if not exists repositories_stars_idx on public.repositories (stars desc);
create index if not exists repositories_featured_idx on public.repositories (featured) where featured = true;
create index if not exists repositories_topics_gin_idx on public.repositories using gin (topics);

comment on table public.repositories is 'Admin-managed Open Source Explorer repositories - source of truth for the public /open-source pages, optionally kept fresh via a GitHub sync (see auto_sync).';

drop trigger if exists set_updated_at on public.repositories;
create trigger set_updated_at
  before update on public.repositories
  for each row
  execute function public.set_updated_at();

alter table public.repositories enable row level security;

drop policy if exists "repositories_select_visible" on public.repositories;
create policy "repositories_select_visible"
  on public.repositories for select
  using (visible = true);

-- Seed: today's TRACKED_REPOS list (src/lib/developer-hub/github.ts),
-- stats deliberately zeroed rather than fabricated - hit "Sync from
-- GitHub" (per-row or bulk) in /admin/repositories right after running
-- this migration to populate real, live star/fork/language/license
-- numbers. github_url is real; everything else starts honest-empty.
insert into public.repositories (id, owner, repo_name, github_url, auto_sync, visible)
values
  ('vercel/next.js', 'vercel', 'next.js', 'https://github.com/vercel/next.js', true, true),
  ('microsoft/vscode', 'microsoft', 'vscode', 'https://github.com/microsoft/vscode', true, true),
  ('facebook/react', 'facebook', 'react', 'https://github.com/facebook/react', true, true),
  ('langchain-ai/langchain', 'langchain-ai', 'langchain', 'https://github.com/langchain-ai/langchain', true, true),
  ('vercel/ai', 'vercel', 'ai', 'https://github.com/vercel/ai', true, true),
  ('sveltejs/svelte', 'sveltejs', 'svelte', 'https://github.com/sveltejs/svelte', true, true),
  ('nodejs/node', 'nodejs', 'node', 'https://github.com/nodejs/node', true, true),
  ('tailwindlabs/tailwindcss', 'tailwindlabs', 'tailwindcss', 'https://github.com/tailwindlabs/tailwindcss', true, true),
  ('denoland/deno', 'denoland', 'deno', 'https://github.com/denoland/deno', true, true),
  ('oven-sh/bun', 'oven-sh', 'bun', 'https://github.com/oven-sh/bun', true, true),
  ('vuejs/vue', 'vuejs', 'vue', 'https://github.com/vuejs/vue', true, true),
  ('supabase/supabase', 'supabase', 'supabase', 'https://github.com/supabase/supabase', true, true)
on conflict (id) do nothing;
