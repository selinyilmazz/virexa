-- Admin Panel: Developer Releases management
--
-- Release content previously lived ONLY in a hardcoded source file
-- (src/data/releases.tsx, TECHNOLOGY_RELEASES) - there was no way for an
-- admin to change a version number, release date, or link from a UI.
-- This table becomes the source of truth for the admin-editable fields
-- listed in the spec (Product, Version, Release Date, Stable/Beta,
-- Release Notes, Documentation, GitHub, Download, Visibility, Featured).
--
-- Scope note (documented here so it isn't silently lost): the deep
-- editorial content on each release's detail page - What's New bullets,
-- full changelog history, breaking changes, API changes, curated
-- resource links, related-release cross-links - stays in
-- src/data/releases.tsx as rich, hand-authored reference content (it was
-- never meant to be authored through a simple admin form, and rebuilding
-- it as one would be a much larger, separate project). The release
-- detail page merges: this table's admin-editable fields (version,
-- release date, channel, notes, links, trending/featured, visibility)
-- OVER that static file's rich content, keyed by `slug` - so an admin
-- really can correct a version/date/link/notes/visibility without
-- touching code, while the long-form content keeps its existing quality.
--
-- Safe to re-run: guarded with IF NOT EXISTS / OR REPLACE / ON CONFLICT.

create table if not exists public.developer_releases (
  id uuid primary key default gen_random_uuid(),
  -- Matches src/data/releases.tsx's TechnologyRelease.slug - the join key
  -- between this table's admin-editable fields and that file's rich
  -- static content. A release with no matching static entry still works
  -- (falls back to this table's fields only, empty rich sections).
  slug text not null unique,
  product text not null,
  version text not null,
  release_date date not null,
  -- Real data already includes more than a strict Stable/Beta binary
  -- (LTS, RC) - kept as its own honest set of values rather than forcing
  -- everything into two buckets.
  channel text not null default 'stable'
    constraint developer_releases_channel_check check (channel in ('stable', 'beta', 'lts', 'rc')),
  release_notes text not null default '',
  maintainer text not null default '',
  license text not null default '',
  platform text not null default '',
  website_url text,
  docs_url text,
  github_url text,
  download_url text,
  featured boolean not null default false,
  trending boolean not null default false,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists developer_releases_visible_idx on public.developer_releases (visible);
create index if not exists developer_releases_release_date_idx on public.developer_releases (release_date desc);
create index if not exists developer_releases_featured_idx on public.developer_releases (featured) where featured = true;

comment on table public.developer_releases is 'Admin-editable release metadata (version/date/channel/notes/links/visibility). Rich editorial content (whats-new, changelog, breaking changes) stays in src/data/releases.tsx, joined by slug - see this file''s top comment.';

drop trigger if exists set_updated_at on public.developer_releases;
create trigger set_updated_at
  before update on public.developer_releases
  for each row
  execute function public.set_updated_at();

alter table public.developer_releases enable row level security;

drop policy if exists "developer_releases_select_visible" on public.developer_releases;
create policy "developer_releases_select_visible"
  on public.developer_releases for select
  using (visible = true);

-- Seed: today's TECHNOLOGY_RELEASES data (src/data/releases.tsx) for the
-- admin-editable subset of fields - real values transcribed from that
-- file, not fabricated. release_notes defaults to each release's short
-- "overview" text; download_url is left null (that file never had one -
-- an admin can add a real one once available).
insert into public.developer_releases (slug, product, version, release_date, channel, release_notes, maintainer, license, platform, website_url, docs_url, github_url, featured, trending, visible)
values
  ('react', 'React', '19.2', '2026-04-14', 'stable',
   'React 19 introduced Actions, the use() hook, and a built-in Compiler that automatically memoizes components - reducing the amount of manual useMemo/useCallback most apps needed.',
   'Meta (React core team) & open source contributors', 'MIT', 'Browser & Node.js (SSR)',
   'https://react.dev/', 'https://react.dev/reference/react', 'https://github.com/facebook/react', true, true, true),

  ('nextjs', 'Next.js', '16.0', '2026-06-02', 'stable',
   'Next.js 16 builds on the App Router with a more predictable caching model, a faster Turbopack-based production build, and continued investment in Server Actions and partial prerendering.',
   'Vercel', 'MIT', 'Node.js, Edge & Browser',
   'https://nextjs.org/', 'https://nextjs.org/docs', 'https://github.com/vercel/next.js', true, true, true),

  ('nodejs', 'Node.js', '24.4.0', '2026-05-11', 'lts',
   'Node.js 24 continues the Active LTS line with a V8 engine bump and native TypeScript stripping improvements.',
   'OpenJS Foundation', 'MIT', 'macOS, Linux, Windows',
   'https://nodejs.org/', 'https://nodejs.org/en/docs', 'https://github.com/nodejs/node', false, false, true),

  ('typescript', 'TypeScript', '5.9', '2026-05-20', 'stable',
   'TypeScript 5.9 finalizes decorators and delivers faster incremental type-checking.',
   'Microsoft', 'Apache-2.0', 'Any JavaScript runtime',
   'https://www.typescriptlang.org/', 'https://www.typescriptlang.org/docs/', 'https://github.com/microsoft/TypeScript', true, false, true),

  ('docker', 'Docker', '27.4', '2026-03-18', 'stable',
   'Docker 27.4 brings Compose Watch and BuildKit caching improvements.',
   'Docker, Inc.', 'Apache-2.0', 'macOS, Linux, Windows',
   'https://www.docker.com/', 'https://docs.docker.com/', 'https://github.com/moby/moby', false, false, true),

  ('python', 'Python', '3.13', '2026-01-15', 'stable',
   'Python 3.13 ships a free-threaded build option, a new REPL, and JIT groundwork.',
   'Python Software Foundation', 'PSF License', 'macOS, Linux, Windows',
   'https://www.python.org/', 'https://docs.python.org/3/', 'https://github.com/python/cpython', false, false, true),

  ('rust', 'Rust', '1.83', '2026-06-25', 'stable',
   'Rust 1.83 stabilizes async closures and speeds up incremental builds.',
   'Rust Foundation', 'MIT / Apache-2.0', 'macOS, Linux, Windows',
   'https://www.rust-lang.org/', 'https://doc.rust-lang.org/book/', 'https://github.com/rust-lang/rust', false, false, true),

  ('bun', 'Bun', '1.2', '2026-07-01', 'stable',
   'Bun 1.2 adds full-text search in bun:sqlite and expands Node.js compatibility.',
   'Oven (Bun team)', 'MIT', 'macOS, Linux, Windows (WSL)',
   'https://bun.sh/', 'https://bun.sh/docs', 'https://github.com/oven-sh/bun', false, true, true),

  ('tailwind', 'Tailwind CSS', '4.1', '2026-05-05', 'stable',
   'Tailwind CSS 4.1 adds container query utilities and improved editor IntelliSense support.',
   'Tailwind Labs', 'MIT', 'Any build toolchain',
   'https://tailwindcss.com/', 'https://tailwindcss.com/docs', 'https://github.com/tailwindlabs/tailwindcss', false, false, true),

  ('kubernetes', 'Kubernetes', '1.32', '2026-04-23', 'stable',
   'Kubernetes 1.32 stabilizes in-place Pod resizing and hardens the Gateway API.',
   'Cloud Native Computing Foundation (CNCF)', 'Apache-2.0', 'macOS, Linux, Windows (cluster nodes: Linux)',
   'https://kubernetes.io/', 'https://kubernetes.io/docs/', 'https://github.com/kubernetes/kubernetes', false, false, true),

  ('vscode', 'Visual Studio Code', '1.96', '2026-07-10', 'stable',
   'VS Code 1.96 improves inline chat and terminal performance.',
   'Microsoft', 'MIT (core), proprietary Microsoft build distribution', 'macOS, Linux, Windows',
   'https://code.visualstudio.com/', 'https://code.visualstudio.com/docs', 'https://github.com/microsoft/vscode', false, false, true),

  ('flutter', 'Flutter', '3.27', '2026-02-12', 'stable',
   'Flutter 3.27 makes Impeller the default renderer on Android and expands Material 3 coverage.',
   'Google', 'BSD-3-Clause', 'iOS, Android, Web, Desktop',
   'https://flutter.dev/', 'https://docs.flutter.dev/', 'https://github.com/flutter/flutter', false, false, true)
on conflict (slug) do nothing;
