-- GitHub Explorer redesign: "Developer Knowledge Library"
--
-- The GitHub Explorer page is being rebuilt from a "what's trending today"
-- feed into an editor-curated library of repositories developers should
-- know about for years, not just this week. That needs real editorial
-- fields on `repositories` (0018/0023) that don't exist yet, plus a
-- genuine admin-managed Collections feature (distinct from the fixed
-- 9-bucket category taxonomy used for the page's quick-filter cards).
--
-- Safe to re-run: guarded with IF NOT EXISTS / ON CONFLICT / OR REPLACE.

-- ============================================================
-- 1) Editorial fields on `repositories`
-- ============================================================

-- Fixed category taxonomy for the "Featured Collections" quick-filter
-- cards on the GitHub Explorer page. Deliberately a CHECK constraint
-- (not a free-form column) - same convention as `articles.category` and
-- `catalog_items.resource_type` elsewhere in this schema: a small, fixed,
-- product-defined set, not something an admin should be able to fat-
-- finger a typo into. `null` is allowed - not every tracked repo needs to
-- be force-fit into one of these 9 buckets.
alter table public.repositories add column if not exists category text
  check (category is null or category in (
    'ai-agents', 'developer-productivity', 'system-design', 'frontend',
    'backend', 'devops', 'cyber-security', 'mobile-development', 'learning-resources'
  ));

-- "A developer should definitely know this" flag - independent of
-- `featured` (0018, already used for the old hero/highlight treatment)
-- so the two curation signals can be set independently: `featured` for
-- prominent placement, `editor_pick` for the dedicated "Editor's Pick"
-- filter/sort/sidebar widget this redesign adds.
alter table public.repositories add column if not exists editor_pick boolean not null default false;

-- Real quality, low mainstream visibility - the opposite signal from
-- `trending` (0018): a repo worth knowing about specifically BECAUSE
-- most developers haven't found it yet.
alter table public.repositories add column if not exists hidden_gem boolean not null default false;

-- Official/maintainer-verified signal (e.g. an official framework repo,
-- a company's own tool) - distinct from `featured`/`editor_pick`, which
-- are about curation quality, not provenance.
alter table public.repositories add column if not exists verified boolean not null default false;

-- Whether the repo is still actively maintained - independent of
-- `archived` (0023, GitHub's own hard "this repo is archived" state).
-- A repo can be un-archived on GitHub but functionally abandoned (no
-- commits in years) - this is an editorial judgment call, not something
-- derivable purely from GitHub's API.
alter table public.repositories add column if not exists maintained boolean not null default true;

alter table public.repositories add column if not exists difficulty text
  check (difficulty is null or difficulty in ('beginner', 'intermediate', 'advanced'));

-- Editor-set 0-100 ranking score, used by the "Editor's Pick" sort option
-- (the default sort for a library that leads with curation, not
-- popularity) - deliberately separate from `health_score` below, which
-- is about the repo's own objective condition, not how strongly an
-- editor is vouching for it.
alter table public.repositories add column if not exists recommendation_score integer not null default 0
  check (recommendation_score between 0 and 100);

-- 0-100 objective-ish health signal (recent activity, maintenance status,
-- not archived) - editor-adjustable rather than purely computed, since
-- "healthy" often needs human judgment a formula can't fully capture
-- (e.g. a slow-but-stable, feature-complete library isn't unhealthy).
-- `repository-sync-service.ts` seeds a reasonable default on sync; admins
-- can override.
alter table public.repositories add column if not exists health_score integer not null default 50
  check (health_score between 0 and 100);

-- The "Why it's recommended" editorial blurb (2-3 sentences) - the
-- specific feature requested to make this a real curated library rather
-- than a plain repository list. Also doubles as the free-text field the
-- new Search filter matches against alongside title/owner/description/
-- topics/tags.
alter table public.repositories add column if not exists editor_notes text not null default '';

-- Editorial tags, distinct from GitHub's own `topics` (0018) - topics are
-- whatever the repo owner tagged on GitHub; tags are Virexa's own
-- curation vocabulary (e.g. "Dev Tool", "CLI", "Library", "Framework",
-- "Template", "Tutorial", "AI Related") used by the redesign's dedicated
-- tag filters, independent of what the upstream repo happens to be
-- tagged with.
alter table public.repositories add column if not exists tags text[] not null default '{}';

-- Manual ordering within a collection/category - same pattern as
-- `catalog_items.display_order` (0022).
alter table public.repositories add column if not exists display_order integer not null default 0;

create index if not exists repositories_category_idx on public.repositories (category);
create index if not exists repositories_editor_pick_idx on public.repositories (editor_pick) where editor_pick = true;
create index if not exists repositories_hidden_gem_idx on public.repositories (hidden_gem) where hidden_gem = true;
create index if not exists repositories_tags_gin_idx on public.repositories using gin (tags);

-- ============================================================
-- 2) Collections (admin-curated repository groupings)
-- ============================================================
--
-- Distinct from the fixed `category` taxonomy above: a collection is an
-- arbitrary, admin-authored grouping (e.g. "Best AI Coding Agents",
-- "Underrated CLI Tools") with hand-picked membership and its own
-- ordering, closer to a museum exhibit than a filing category. One repo
-- can belong to many collections; one collection groups many repos - a
-- join table, not a foreign key on `repositories`.

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  -- Emoji or icon identifier, same lightweight convention as
  -- `catalog_items.emoji` (0022) - no icon asset pipeline needed.
  icon text not null default '',
  display_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists collections_visible_idx on public.collections (visible);
create index if not exists collections_display_order_idx on public.collections (display_order);

drop trigger if exists set_updated_at on public.collections;
create trigger set_updated_at
  before update on public.collections
  for each row
  execute function public.set_updated_at();

alter table public.collections enable row level security;

drop policy if exists "collections_select_visible" on public.collections;
create policy "collections_select_visible"
  on public.collections for select
  using (visible = true);

comment on table public.collections is 'Admin-curated repository collections (arbitrary named groupings, distinct from repositories.category) - see collection_repositories for membership.';

create table if not exists public.collection_repositories (
  collection_id uuid not null references public.collections (id) on delete cascade,
  repository_id text not null references public.repositories (id) on delete cascade,
  display_order integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (collection_id, repository_id)
);

create index if not exists collection_repositories_repository_idx on public.collection_repositories (repository_id);
create index if not exists collection_repositories_order_idx on public.collection_repositories (collection_id, display_order);

alter table public.collection_repositories enable row level security;

-- A membership row is publicly visible only when BOTH its collection and
-- its repository are themselves visible - joining this table without
-- that second check would leak repos that were individually hidden by an
-- admin (visible = false on `repositories`) into an otherwise-visible
-- collection's public listing.
drop policy if exists "collection_repositories_select_visible" on public.collection_repositories;
create policy "collection_repositories_select_visible"
  on public.collection_repositories for select
  using (
    exists (select 1 from public.collections c where c.id = collection_id and c.visible = true)
    and exists (select 1 from public.repositories r where r.id = repository_id and r.visible = true and r.archived = false)
  );

comment on table public.collection_repositories is 'Join table: which repositories belong to which admin-curated collection, with per-collection manual ordering.';
