-- GitHub Explorer "Developer Knowledge Library" - schema catch-up + curation content pass
--
-- IMPORTANT CONTEXT: this migration was originally written assuming
-- 0024_repositories_editorial_and_collections.sql and
-- 0025_github_library_media_and_collections.sql had already been applied
-- to the live database. They had not been - production's `repositories`
-- table still only has the 0018/0023 columns (id, owner, repo_name,
-- description, language, license, stars, forks, github_url, topics,
-- repo_created_at, featured, trending, visible, auto_sync,
-- last_synced_at, created_at, updated_at, watchers, latest_release_tag,
-- latest_release_published_at, archived) and `collections`/
-- `collection_repositories` don't exist at all yet. Running the original
-- version of this file failed immediately with `column "category" does
-- not exist`.
--
-- This rewrite is fully self-contained: it does NOT assume 0024 or 0025
-- ever ran. Section 1 below re-issues every column/table/index/trigger/
-- policy those two migrations were supposed to create (verbatim, still
-- guarded with IF NOT EXISTS / CREATE TABLE IF NOT EXISTS, so it is a
-- harmless no-op on any database where they DID already apply). Only
-- after every column and table Section 1 establishes is guaranteed to
-- exist does Section 2 add this migration's own new columns, Section 3
-- extend the category taxonomy, and Sections 4-6 backfill/insert data.
--
-- Every ALTER/CREATE here is IF NOT EXISTS; every UPDATE/INSERT only
-- touches columns established earlier in this same file; the whole
-- migration is safe to run start-to-finish on a database in ANY of these
-- three states: (a) only 0001-0023 applied, (b) 0001-0025 applied, or
-- (c) this migration partially applied before (safe to re-run after
-- fixing an error).

-- ============================================================
-- 1) Catch-up: everything 0024 and 0025 were supposed to create
-- ============================================================

-- --- 1a. Editorial columns on `repositories` (originally 0024) ---
alter table public.repositories add column if not exists category text;
alter table public.repositories add column if not exists editor_pick boolean not null default false;
alter table public.repositories add column if not exists hidden_gem boolean not null default false;
alter table public.repositories add column if not exists verified boolean not null default false;
alter table public.repositories add column if not exists maintained boolean not null default true;
alter table public.repositories add column if not exists difficulty text;
alter table public.repositories add column if not exists recommendation_score integer not null default 0;
alter table public.repositories add column if not exists health_score integer not null default 50;
alter table public.repositories add column if not exists editor_notes text not null default '';
alter table public.repositories add column if not exists tags text[] not null default '{}';
alter table public.repositories add column if not exists display_order integer not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'repositories_difficulty_check') then
    alter table public.repositories add constraint repositories_difficulty_check
      check (difficulty is null or difficulty in ('beginner', 'intermediate', 'advanced'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'repositories_recommendation_score_check') then
    alter table public.repositories add constraint repositories_recommendation_score_check
      check (recommendation_score between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'repositories_health_score_check') then
    alter table public.repositories add constraint repositories_health_score_check
      check (health_score between 0 and 100);
  end if;
end $$;

create index if not exists repositories_category_idx on public.repositories (category);
create index if not exists repositories_editor_pick_idx on public.repositories (editor_pick) where editor_pick = true;
create index if not exists repositories_hidden_gem_idx on public.repositories (hidden_gem) where hidden_gem = true;
create index if not exists repositories_tags_gin_idx on public.repositories using gin (tags);

-- --- 1b. Collections (originally 0024) ---
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
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

drop policy if exists "collection_repositories_select_visible" on public.collection_repositories;
create policy "collection_repositories_select_visible"
  on public.collection_repositories for select
  using (
    exists (select 1 from public.collections c where c.id = collection_id and c.visible = true)
    and exists (select 1 from public.repositories r where r.id = repository_id and r.visible = true and r.archived = false)
  );

-- --- 1c. Media/media-adjacent columns (originally 0025) ---
alter table public.repositories add column if not exists cover_image_url text;
alter table public.repositories add column if not exists audience text not null default '';

alter table public.collections add column if not exists cover_image_url text;
alter table public.collections add column if not exists difficulty text;
alter table public.collections add column if not exists estimated_learning_time text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'collections_difficulty_check') then
    alter table public.collections add constraint collections_difficulty_check
      check (difficulty is null or difficulty in ('beginner', 'intermediate', 'advanced'));
  end if;
end $$;

create index if not exists repositories_updated_at_idx on public.repositories (updated_at desc);

-- ============================================================
-- 2) This migration's own new columns
-- ============================================================

-- Real GitHub `open_issues_count` (includes PRs, same definition GitHub's
-- own UI uses) - populated by repository-sync-service.ts going forward.
-- Never fabricated: defaults to 0 and the UI hides the stat until a real
-- sync has run at least once and found a genuinely nonzero count.
alter table public.repositories add column if not exists open_issues_count integer not null default 0;

-- Real GitHub contributor count - a second API call per repo
-- (`/contributors?per_page=1&anon=true`, read off the `Link` header's
-- last page number), so it's only fetched during an explicit sync, not
-- on every catalog read. Nullable (not defaulted to 0) specifically so
-- the UI can distinguish "never synced yet" (null, hidden) from "synced
-- and GitHub reported 0" (0, also hidden - a repo always has at least
-- one contributor, so a real 0 would itself indicate a fetch that only
-- partially succeeded).
alter table public.repositories add column if not exists contributors_count integer;

-- Official docs site, when distinct from the GitHub repo itself (e.g.
-- nextjs.org/docs, docs.djangoproject.com). Admin-authored - GitHub's API
-- has no reliable "documentation URL" field to sync this from.
alter table public.repositories add column if not exists documentation_url text;

-- Official project/product website, when one exists separate from GitHub
-- (e.g. react.dev, kubernetes.io). Admin-authored, same reasoning as
-- documentation_url.
alter table public.repositories add column if not exists website_url text;

-- Editor-set 0-100 "how strong is this project's real-world community"
-- signal (adoption, ecosystem, Stack Overflow/Discord activity) -
-- distinct from `health_score` (repo's own maintenance condition) and
-- `recommendation_score` (editor's personal curation ranking): this one
-- is specifically about community strength, the spec's explicit
-- "Community Score" card field.
alter table public.repositories add column if not exists community_score integer not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'repositories_community_score_check') then
    alter table public.repositories add constraint repositories_community_score_check
      check (community_score between 0 and 100);
  end if;
end $$;

-- Ordered "how to learn this repository" steps for the detail page's
-- Learning Roadmap section - admin-authored, optional (empty array is
-- the default and the section is simply omitted, never a fabricated
-- generic roadmap).
alter table public.repositories add column if not exists learning_roadmap text[] not null default '{}';

create index if not exists repositories_community_score_idx on public.repositories (community_score desc);

-- ============================================================
-- 3) Extend the fixed category taxonomy: + Cloud, + Databases
-- ============================================================
-- 0024 was meant to ship 9 categories; the curation brief this migration
-- fulfills needs 2 more (Cloud infrastructure tooling, Database
-- engines/ORMs) that don't cleanly fit any existing bucket. Still a
-- small, fixed, product-defined CHECK list - not opened up to free text.
-- Goes straight to the final 11-value list rather than recreating 0024's
-- original 9-value version first, since that version is not guaranteed
-- to have ever existed on this database.

alter table public.repositories drop constraint if exists repositories_category_check;
alter table public.repositories add constraint repositories_category_check
  check (category is null or category in (
    'ai-agents', 'developer-productivity', 'system-design', 'frontend',
    'backend', 'devops', 'cyber-security', 'mobile-development', 'learning-resources',
    'cloud', 'databases'
  ));

-- ============================================================
-- 4) Backfill editorial content onto the original 12 repos (0018)
-- ============================================================
-- Only editorial columns are touched here - description/stars/forks/etc
-- stay whatever the last GitHub sync set them to (or 0, pending one).
-- Every UPDATE below is a plain `where id = '...'` and is naturally a
-- no-op if that id isn't present, so this section is safe to re-run.

update public.repositories set
  category = 'frontend', difficulty = 'intermediate', verified = true, maintained = true,
  recommendation_score = 97, health_score = 96, community_score = 96, featured = true, editor_pick = true,
  tags = '{"Framework","Dev Tool"}', audience = 'React developers building production web apps who want file-based routing, server components, and zero-config deployment.',
  editor_notes = 'The default choice for production React today - server components, file-based routing, and first-class deployment story make it the fastest path from idea to shipped app.',
  website_url = 'https://nextjs.org', documentation_url = 'https://nextjs.org/docs',
  learning_roadmap = '{"Learn React fundamentals (components, hooks, state)","Build a static page with the App Router","Add data fetching with Server Components","Add API routes and Server Actions for mutations","Deploy to Vercel or a Node host"}',
  display_order = 1
where id = 'vercel/next.js';

update public.repositories set
  category = 'developer-productivity', difficulty = 'intermediate', verified = true, maintained = true,
  recommendation_score = 92, health_score = 95, community_score = 94, featured = true, editor_pick = false,
  tags = '{"Dev Tool"}', audience = 'Any developer who wants a free, extensible, cross-platform code editor with a huge extension ecosystem.',
  editor_notes = 'The de facto standard code editor - lightweight enough to feel instant, extensible enough to replace a full IDE for almost any language.',
  website_url = 'https://code.visualstudio.com', documentation_url = 'https://code.visualstudio.com/docs',
  display_order = 2
where id = 'microsoft/vscode';

update public.repositories set
  category = 'frontend', difficulty = 'intermediate', verified = true, maintained = true,
  recommendation_score = 96, health_score = 95, community_score = 97, featured = true, editor_pick = true,
  tags = '{"Library","Framework"}', audience = 'Frontend developers who want the largest ecosystem and job market for building component-based UIs.',
  editor_notes = 'Still the most widely deployed UI library in the industry - the ecosystem, tooling, and hiring pool around it are unmatched.',
  website_url = 'https://react.dev', documentation_url = 'https://react.dev/learn',
  learning_roadmap = '{"Learn JSX and component basics","Master useState/useEffect and the rules of hooks","Learn component composition and prop patterns","Add a router and global state (Context or a library)","Learn a meta-framework (Next.js/Remix) for production apps"}',
  display_order = 3
where id = 'facebook/react';

update public.repositories set
  category = 'ai-agents', difficulty = 'intermediate', verified = true, maintained = true,
  recommendation_score = 90, health_score = 88, community_score = 92, featured = true, editor_pick = true, hidden_gem = false,
  tags = '{"AI Related","Framework"}', audience = 'Python/JS developers building LLM-powered apps that chain prompts, tools, and retrieval together.',
  editor_notes = 'The most widely adopted framework for chaining LLM calls, tools, and retrieval into real applications - a near-default starting point for RAG and agent projects.',
  website_url = 'https://www.langchain.com', documentation_url = 'https://python.langchain.com/docs/introduction',
  learning_roadmap = '{"Understand prompts, chains, and LLM wrappers","Build a simple retrieval-augmented (RAG) pipeline","Add memory and multi-step chains","Wire in tools/agents for external actions","Move to LangGraph for stateful, production agents"}',
  display_order = 4
where id = 'langchain-ai/langchain';

update public.repositories set
  category = 'ai-agents', difficulty = 'intermediate', verified = true, maintained = true,
  recommendation_score = 87, health_score = 90, community_score = 85, editor_pick = false, hidden_gem = true,
  tags = '{"AI Related","Library"}', audience = 'Next.js/React developers who want streaming AI chat UIs without hand-rolling SSE/websocket plumbing.',
  editor_notes = 'The cleanest way to wire streaming LLM responses into a React/Next.js UI - handles the hard parts (streaming, tool calls, edge runtimes) so you don''t have to.',
  website_url = 'https://sdk.vercel.ai', documentation_url = 'https://sdk.vercel.ai/docs',
  display_order = 5
where id = 'vercel/ai';

update public.repositories set
  category = 'frontend', difficulty = 'intermediate', verified = true, maintained = true,
  recommendation_score = 89, health_score = 92, community_score = 88, editor_pick = false, hidden_gem = true,
  tags = '{"Framework"}', audience = 'Frontend developers who want a compiler-based framework with less runtime overhead and less boilerplate than React.',
  editor_notes = 'Compiles away most of its own runtime, so shipped bundles are smaller and components read closer to plain HTML/JS/CSS than any mainstream alternative.',
  website_url = 'https://svelte.dev', documentation_url = 'https://svelte.dev/docs',
  display_order = 6
where id = 'sveltejs/svelte';

update public.repositories set
  category = 'backend', difficulty = 'beginner', verified = true, maintained = true,
  recommendation_score = 93, health_score = 95, community_score = 97, featured = true, editor_pick = false,
  tags = '{"Dev Tool"}', audience = 'Every JavaScript/TypeScript developer - the runtime nearly all Node backend and tooling work assumes.',
  editor_notes = 'The runtime underneath most of the JavaScript backend ecosystem - understanding it well pays off even if your actual server framework changes.',
  website_url = 'https://nodejs.org', documentation_url = 'https://nodejs.org/en/docs',
  display_order = 7
where id = 'nodejs/node';

update public.repositories set
  category = 'frontend', difficulty = 'beginner', verified = true, maintained = true,
  recommendation_score = 94, health_score = 95, community_score = 93, featured = true, editor_pick = true,
  tags = '{"Dev Tool","Framework"}', audience = 'Any frontend developer who wants to style UI directly in markup without writing separate CSS files.',
  editor_notes = 'Utility-first CSS that''s become the default styling approach for new projects - fast to write, easy to keep consistent, no dead CSS to prune later.',
  website_url = 'https://tailwindcss.com', documentation_url = 'https://tailwindcss.com/docs',
  display_order = 8
where id = 'tailwindlabs/tailwindcss';

update public.repositories set
  category = 'developer-productivity', difficulty = 'intermediate', verified = true, maintained = true,
  recommendation_score = 85, health_score = 90, community_score = 82, editor_pick = false, hidden_gem = true,
  tags = '{"Dev Tool"}', audience = 'TypeScript/JavaScript developers who want a single toolchain for runtime, bundling, testing, and package management.',
  editor_notes = 'An all-in-one JavaScript runtime, bundler, test runner, and package manager - genuinely faster than the Node.js equivalents it replaces.',
  website_url = 'https://deno.com', documentation_url = 'https://docs.deno.com',
  display_order = 9
where id = 'denoland/deno';

update public.repositories set
  category = 'developer-productivity', difficulty = 'intermediate', verified = true, maintained = true,
  recommendation_score = 88, health_score = 92, community_score = 86, editor_pick = false, hidden_gem = true,
  tags = '{"Dev Tool"}', audience = 'JavaScript/TypeScript developers frustrated with slow npm/yarn installs and Node startup time.',
  editor_notes = 'A drop-in Node.js/npm replacement that''s dramatically faster at installs, startup, and test execution - low-risk to try on an existing project.',
  website_url = 'https://bun.sh', documentation_url = 'https://bun.sh/docs',
  display_order = 10
where id = 'oven-sh/bun';

update public.repositories set
  category = 'frontend', difficulty = 'beginner', verified = true, maintained = true,
  recommendation_score = 90, health_score = 90, community_score = 90, editor_pick = false,
  tags = '{"Framework"}', audience = 'Frontend developers who want a gentler learning curve than React with excellent official documentation.',
  editor_notes = 'The most approachable of the major frontend frameworks - official docs and tooling are exceptionally well designed for newcomers.',
  website_url = 'https://vuejs.org', documentation_url = 'https://vuejs.org/guide/introduction.html',
  display_order = 11
where id = 'vuejs/vue';

update public.repositories set
  category = 'databases', difficulty = 'intermediate', verified = true, maintained = true,
  recommendation_score = 93, health_score = 93, community_score = 91, featured = true, editor_pick = true,
  tags = '{"Dev Tool","Framework"}', audience = 'Developers who want a self-hostable, open-source alternative to Firebase built on real Postgres.',
  editor_notes = 'A genuinely open-source Firebase alternative - real Postgres underneath, with auth, storage, and realtime built in rather than a proprietary database.',
  website_url = 'https://supabase.com', documentation_url = 'https://supabase.com/docs',
  display_order = 12
where id = 'supabase/supabase';

-- ============================================================
-- 5) New curated repositories, by category
-- ============================================================

-- --- AI ---
insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, learning_roadmap, display_order)
values
  ('openai/openai-python', 'openai', 'openai-python', 'https://github.com/openai/openai-python', 'ai-agents', 'beginner', true, true, 88, 92, 90, false, false, '{"AI Related","Library"}', 'Python developers calling OpenAI''s models directly without a heavier agent framework on top.', 'The official, minimal-overhead client for OpenAI''s API - the right starting point before reaching for a bigger framework.', 'https://platform.openai.com', 'https://platform.openai.com/docs', '{}', 20),
  ('huggingface/transformers', 'huggingface', 'transformers', 'https://github.com/huggingface/transformers', 'ai-agents', 'advanced', true, true, 92, 93, 94, true, false, '{"AI Related","Library"}', 'ML engineers and researchers who need to run or fine-tune open-weight models locally or in production.', 'The standard library for working with open-weight models - thousands of pretrained models are one line of code away.', 'https://huggingface.co', 'https://huggingface.co/docs/transformers', '{"Learn tokenizers and the pipeline() API","Run inference with a pretrained model","Fine-tune a small model on your own data","Explore the Hub for task-specific models"}', 21),
  ('microsoft/autogen', 'microsoft', 'autogen', 'https://github.com/microsoft/autogen', 'ai-agents', 'advanced', true, true, 82, 84, 78, false, true, '{"AI Related","Framework"}', 'Developers building multi-agent systems where several LLM agents collaborate on a task.', 'One of the earliest serious multi-agent orchestration frameworks - useful once a single agent/chain isn''t enough for the problem.', 'https://microsoft.github.io/autogen', 'https://microsoft.github.io/autogen/docs/Getting-Started', '{}', 22),
  ('crewAIInc/crewAI', 'crewAIInc', 'crewAI', 'https://github.com/crewAIInc/crewAI', 'ai-agents', 'intermediate', true, true, 83, 85, 76, false, true, '{"AI Related","Framework"}', 'Developers who want role-based multi-agent workflows (a "crew" of specialized agents) without LangChain''s full surface area.', 'A lighter-weight take on multi-agent orchestration - agents get explicit roles and goals, which reads more naturally than raw chain composition.', 'https://www.crewai.com', 'https://docs.crewai.com', '{}', 23)
on conflict (id) do nothing;

-- --- Developer Productivity / Tools ---
insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, learning_roadmap, display_order)
values
  ('vercel/turborepo', 'vercel', 'turborepo', 'https://github.com/vercel/turborepo', 'developer-productivity', 'intermediate', true, true, 85, 88, 80, false, true, '{"Dev Tool"}', 'Teams running a monorepo with multiple apps/packages that want fast, cached builds.', 'Makes monorepo builds fast via aggressive local/remote caching - the difference is dramatic once a repo has more than a couple of packages.', 'https://turbo.build', 'https://turbo.build/repo/docs', '{}', 30),
  ('pnpm/pnpm', 'pnpm', 'pnpm', 'https://github.com/pnpm/pnpm', 'developer-productivity', 'beginner', true, true, 87, 91, 84, false, true, '{"Dev Tool","CLI"}', 'Any Node.js developer tired of slow installs and duplicated node_modules across projects.', 'A content-addressable package manager that''s both faster and dramatically more disk-efficient than npm/yarn, with none of npm''s phantom-dependency bugs.', 'https://pnpm.io', 'https://pnpm.io/motivation', '{}', 31),
  ('vitejs/vite', 'vitejs', 'vite', 'https://github.com/vitejs/vite', 'developer-productivity', 'beginner', true, true, 92, 93, 91, true, false, '{"Dev Tool","Framework"}', 'Frontend developers who want near-instant dev server startup and hot module reload.', 'The modern default frontend build tool - native ESM in dev means a dev server that starts and reloads almost instantly, even on large apps.', 'https://vitejs.dev', 'https://vitejs.dev/guide', '{}', 32),
  ('eslint/eslint', 'eslint', 'eslint', 'https://github.com/eslint/eslint', 'developer-productivity', 'beginner', true, true, 89, 92, 88, false, false, '{"Dev Tool","CLI"}', 'Any JavaScript/TypeScript team that wants consistent code quality enforced automatically.', 'The standard JavaScript linter - catches real bugs, not just style nits, and its plugin ecosystem covers virtually every framework.', 'https://eslint.org', 'https://eslint.org/docs/latest', '{}', 33),
  ('prettier/prettier', 'prettier', 'prettier', 'https://github.com/prettier/prettier', 'developer-productivity', 'beginner', true, true, 88, 91, 87, false, false, '{"Dev Tool","CLI"}', 'Teams who want to stop arguing about code formatting in pull requests.', 'Opinionated, zero-config code formatting - once adopted, formatting simply stops being a discussion topic in code review.', 'https://prettier.io', 'https://prettier.io/docs/en/index.html', '{}', 34)
on conflict (id) do nothing;

-- --- Frontend ---
insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('angular/angular', 'angular', 'angular', 'https://github.com/angular/angular', 'frontend', 'advanced', true, true, 85, 88, 84, false, false, '{"Framework"}', 'Teams (often enterprise) that want a full, opinionated framework with everything - routing, forms, DI - built in.', 'A batteries-included framework rather than a library - trades some flexibility for a consistent, well-documented way to structure large applications.', 'https://angular.dev', 'https://angular.dev/overview', 40)
on conflict (id) do nothing;

-- --- Backend ---
insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('nestjs/nest', 'nestjs', 'nest', 'https://github.com/nestjs/nest', 'backend', 'intermediate', true, true, 88, 90, 85, true, false, '{"Framework"}', 'Node.js/TypeScript developers who want an opinionated, Angular-inspired structure for backend services.', 'Brings real architecture (modules, dependency injection, decorators) to Node.js backends - the closest thing the ecosystem has to a Spring/Angular-style framework.', 'https://nestjs.com', 'https://docs.nestjs.com', 50),
  ('expressjs/express', 'expressjs', 'express', 'https://github.com/expressjs/express', 'backend', 'beginner', true, true, 86, 84, 92, false, false, '{"Framework"}', 'Anyone building a Node.js HTTP API who wants a minimal, unopinionated foundation.', 'The original minimal Node.js web framework - still the most widely known and the most-copied API shape in the ecosystem.', 'https://expressjs.com', 'https://expressjs.com/en/4x/api.html', 51),
  ('fastify/fastify', 'fastify', 'fastify', 'https://github.com/fastify/fastify', 'backend', 'intermediate', true, true, 84, 89, 74, false, true, '{"Framework"}', 'Node.js developers who need Express-like ergonomics but with meaningfully better throughput.', 'A schema-first, plugin-based Node.js framework built for speed - often the right choice once Express''s performance ceiling becomes a real constraint.', 'https://fastify.dev', 'https://fastify.dev/docs/latest', 52),
  ('gin-gonic/gin', 'gin-gonic', 'gin', 'https://github.com/gin-gonic/gin', 'backend', 'intermediate', true, true, 83, 87, 76, false, true, '{"Framework"}', 'Go developers who want a fast, minimal HTTP framework with good middleware support.', 'The most widely used Go web framework - a thin, fast router with a middleware model that stays out of your way.', 'https://gin-gonic.com', 'https://gin-gonic.com/docs', 53),
  ('django/django', 'django', 'django', 'https://github.com/django/django', 'backend', 'intermediate', true, true, 89, 90, 90, true, false, '{"Framework"}', 'Python developers who want a full-featured, batteries-included web framework (ORM, admin, auth all built in).', 'A genuinely complete web framework - the built-in admin panel and ORM alone can save weeks on a typical CRUD-heavy backend.', 'https://www.djangoproject.com', 'https://docs.djangoproject.com', 54)
on conflict (id) do nothing;

-- --- Cloud ---
insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, learning_roadmap, display_order)
values
  ('kubernetes/kubernetes', 'kubernetes', 'kubernetes', 'https://github.com/kubernetes/kubernetes', 'cloud', 'advanced', true, true, 93, 92, 95, true, false, '{"Dev Tool"}', 'Platform/infrastructure engineers running containerized workloads at scale.', 'The industry-standard container orchestrator - not always necessary at small scale, but the default assumption for any serious cloud-native platform team.', 'https://kubernetes.io', 'https://kubernetes.io/docs', '{"Learn containers and Docker first","Understand Pods, Deployments, and Services","Learn ConfigMaps/Secrets and networking basics","Deploy a real app with a Helm chart","Learn observability (metrics, logs) on a cluster"}', 60),
  ('hashicorp/terraform', 'hashicorp', 'terraform', 'https://github.com/hashicorp/terraform', 'cloud', 'intermediate', true, true, 90, 89, 88, true, false, '{"Dev Tool"}', 'Infrastructure/platform engineers who want cloud resources defined as version-controlled code.', 'The standard tool for infrastructure-as-code across every major cloud provider - one declarative language instead of provider-specific consoles or scripts.', 'https://www.terraform.io', 'https://developer.hashicorp.com/terraform/docs', '{}', 61),
  ('helm/helm', 'helm', 'helm', 'https://github.com/helm/helm', 'cloud', 'intermediate', true, true, 84, 87, 80, false, true, '{"Dev Tool"}', 'Kubernetes users who are tired of hand-writing and templating raw YAML manifests.', 'The de facto package manager for Kubernetes - packages, templates, and versions a whole application''s manifests as one installable chart.', 'https://helm.sh', 'https://helm.sh/docs', '{}', 62),
  ('istio/istio', 'istio', 'istio', 'https://github.com/istio/istio', 'cloud', 'advanced', true, true, 80, 83, 74, false, true, '{"Dev Tool"}', 'Teams running many microservices on Kubernetes who need traffic control, mTLS, and observability between services.', 'A full-featured service mesh - real power for large microservice fleets, though it''s genuinely overkill below a certain scale.', 'https://istio.io', 'https://istio.io/latest/docs', '{}', 63)
on conflict (id) do nothing;

-- --- DevOps ---
insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, learning_roadmap, display_order)
values
  ('moby/moby', 'moby', 'moby', 'https://github.com/moby/moby', 'devops', 'intermediate', true, true, 92, 89, 93, true, false, '{"Dev Tool"}', 'Every developer who needs consistent, reproducible environments across machines and deployment targets.', 'The open-source engine behind Docker - understanding containers here pays off no matter which orchestrator sits on top later.', 'https://www.docker.com', 'https://docs.docker.com', '{"Learn images vs. containers","Write a Dockerfile for a real app","Learn volumes and networking basics","Use docker-compose for multi-container local dev"}', 70),
  ('grafana/grafana', 'grafana', 'grafana', 'https://github.com/grafana/grafana', 'devops', 'intermediate', true, true, 86, 89, 84, false, false, '{"Dev Tool"}', 'Teams who need dashboards over metrics/logs from Prometheus, databases, or cloud providers.', 'The standard open-source dashboarding tool - connects to nearly every metrics/logging backend and is usually paired with Prometheus.', 'https://grafana.com', 'https://grafana.com/docs', '{}', 71),
  ('prometheus/prometheus', 'prometheus', 'prometheus', 'https://github.com/prometheus/prometheus', 'devops', 'advanced', true, true, 87, 88, 85, false, false, '{"Dev Tool"}', 'Teams who need real-time metrics collection and alerting for services and infrastructure.', 'The standard open-source metrics/alerting system for cloud-native infrastructure - the pull-based model and query language (PromQL) are worth learning well.', 'https://prometheus.io', 'https://prometheus.io/docs', '{}', 72)
on conflict (id) do nothing;

-- --- Security ---
insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('OWASP/CheatSheetSeries', 'OWASP', 'CheatSheetSeries', 'https://github.com/OWASP/CheatSheetSeries', 'cyber-security', 'beginner', true, true, 88, 91, 82, true, false, '{"Tutorial","Dev Tool"}', 'Any developer who wants concrete, practical secure-coding guidance rather than abstract security theory.', 'The most practical secure-coding reference that exists - concrete, actionable guidance per vulnerability class, not a wall of theory.', 'https://cheatsheetseries.owasp.org', null, 80),
  ('rapid7/metasploit-framework', 'rapid7', 'metasploit-framework', 'https://github.com/rapid7/metasploit-framework', 'cyber-security', 'advanced', true, true, 83, 84, 87, false, false, '{"Dev Tool","CLI"}', 'Security professionals doing authorized penetration testing and exploit development.', 'The standard penetration testing framework - essential for offensive security work, strictly for authorized testing on systems you own or have permission to test.', 'https://www.metasploit.com', 'https://docs.metasploit.com', 81),
  ('aquasecurity/trivy', 'aquasecurity', 'trivy', 'https://github.com/aquasecurity/trivy', 'cyber-security', 'beginner', true, true, 85, 90, 76, false, true, '{"Dev Tool","CLI"}', 'Teams who want to scan container images, filesystems, and IaC for known vulnerabilities in CI.', 'A fast, all-in-one vulnerability scanner - containers, filesystems, git repos, and Terraform/IaC misconfigurations all covered by one CLI tool.', 'https://trivy.dev', 'https://trivy.dev/latest', 82),
  ('zaproxy/zaproxy', 'zaproxy', 'zaproxy', 'https://github.com/zaproxy/zaproxy', 'cyber-security', 'intermediate', true, true, 81, 85, 79, false, true, '{"Dev Tool"}', 'Developers and testers who want to find web application vulnerabilities before an attacker does.', 'The most widely used free web app security scanner (OWASP ZAP) - a solid first line of defense for catching common web vulnerabilities pre-release.', 'https://www.zaproxy.org', 'https://www.zaproxy.org/docs', 83)
on conflict (id) do nothing;

-- --- Mobile ---
insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('flutter/flutter', 'flutter', 'flutter', 'https://github.com/flutter/flutter', 'mobile-development', 'intermediate', true, true, 89, 90, 87, true, false, '{"Framework"}', 'Developers who want one codebase compiling to native performance on iOS, Android, web, and desktop.', 'Compiles to real native code (not a WebView wrapper) with one Dart codebase covering iOS, Android, web, and desktop - the widest cross-platform reach available.', 'https://flutter.dev', 'https://docs.flutter.dev', 90),
  ('facebook/react-native', 'facebook', 'react-native', 'https://github.com/facebook/react-native', 'mobile-development', 'intermediate', true, true, 87, 85, 89, false, false, '{"Framework"}', 'React developers who want to reuse their skills and (partially) their code for native iOS/Android apps.', 'The natural choice if your team already knows React - real native UI components, not a webview, with a large ecosystem (Expo especially) around it.', 'https://reactnative.dev', 'https://reactnative.dev/docs/getting-started', 91),
  ('JetBrains/kotlin', 'JetBrains', 'kotlin', 'https://github.com/JetBrains/kotlin', 'mobile-development', 'intermediate', true, true, 85, 87, 83, false, false, '{"Library"}', 'Android developers (Kotlin is Google''s recommended language) and anyone wanting a more modern JVM language than Java.', 'Google''s preferred language for Android development - more concise and null-safe than Java, and increasingly used for backend/multiplatform code too.', 'https://kotlinlang.org', 'https://kotlinlang.org/docs', 92),
  ('apple/swift', 'apple', 'swift', 'https://github.com/apple/swift', 'mobile-development', 'intermediate', true, true, 85, 86, 82, false, false, '{"Library"}', 'iOS/macOS developers - Swift is the required language for modern Apple platform development.', 'The language every modern iOS/macOS app is built in today - fast, type-safe, and tightly integrated with Apple''s frameworks.', 'https://www.swift.org', 'https://www.swift.org/documentation', 93)
on conflict (id) do nothing;

-- --- Databases ---
insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, learning_roadmap, display_order)
values
  ('postgres/postgres', 'postgres', 'postgres', 'https://github.com/postgres/postgres', 'databases', 'advanced', true, true, 93, 94, 92, true, false, '{"Dev Tool"}', 'Anyone choosing a primary relational database for a new project.', 'The most capable open-source relational database available - strong standards compliance, extensions for nearly everything (including full-text search and vectors), and a default choice for good reason.', 'https://www.postgresql.org', 'https://www.postgresql.org/docs', '{"Learn core SQL and normalization","Understand indexes and query planning (EXPLAIN)","Learn transactions and isolation levels","Explore extensions (pg_trgm, pgvector, etc.)"}', 100),
  ('prisma/prisma', 'prisma', 'prisma', 'https://github.com/prisma/prisma', 'databases', 'beginner', true, true, 87, 88, 85, false, false, '{"Dev Tool","Library"}', 'TypeScript/Node.js developers who want a type-safe ORM with a great migration workflow.', 'A schema-first ORM with genuinely excellent TypeScript autocompletion and a smooth migration story - the most approachable ORM for a Node/TS backend today.', 'https://www.prisma.io', 'https://www.prisma.io/docs', '{}', 101),
  ('drizzle-team/drizzle-orm', 'drizzle-team', 'drizzle-orm', 'https://github.com/drizzle-team/drizzle-orm', 'databases', 'intermediate', true, true, 83, 86, 74, false, true, '{"Dev Tool","Library"}', 'TypeScript developers who want SQL-like ergonomics and minimal runtime overhead compared to a heavier ORM.', 'A lighter, more SQL-like alternative to Prisma - less abstraction, less runtime overhead, and queries that read close to the SQL they generate.', 'https://orm.drizzle.team', 'https://orm.drizzle.team/docs/overview', '{}', 102),
  ('redis/redis', 'redis', 'redis', 'https://github.com/redis/redis', 'databases', 'intermediate', true, true, 90, 90, 91, false, false, '{"Dev Tool"}', 'Any backend that needs a fast cache, session store, queue, or pub/sub layer.', 'The standard in-memory data store - caching is the obvious use case, but its data structures (lists, sets, sorted sets, streams) cover far more than that.', 'https://redis.io', 'https://redis.io/docs/latest', '{}', 103)
on conflict (id) do nothing;

-- --- System Design & Learning Resources ---
insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('donnemartin/system-design-primer', 'donnemartin', 'system-design-primer', 'https://github.com/donnemartin/system-design-primer', 'system-design', 'intermediate', false, true, 86, 82, 90, true, false, '{"Tutorial"}', 'Developers preparing for system design interviews or wanting a structured intro to distributed systems concepts.', 'The most widely used free resource for learning system design - the interview Q&A section alone is worth the read for anyone job-hunting.', null, null, 110),
  ('freeCodeCamp/freeCodeCamp', 'freeCodeCamp', 'freeCodeCamp', 'https://github.com/freeCodeCamp/freeCodeCamp', 'learning-resources', 'beginner', true, true, 88, 87, 93, true, false, '{"Tutorial"}', 'Beginners who want a free, structured, project-based path into web development.', 'A genuinely free, complete curriculum from first line of HTML through backend development and certification - one of the best on-ramps into the field.', 'https://www.freecodecamp.org', null, 111),
  ('kamranahmedse/developer-roadmap', 'kamranahmedse', 'developer-roadmap', 'https://github.com/kamranahmedse/developer-roadmap', 'learning-resources', 'beginner', false, true, 85, 84, 88, false, true, '{"Tutorial","Template"}', 'Developers who want a visual map of what to learn next for a given role (frontend, backend, DevOps, and more).', 'The visual "what should I learn next" map behind roadmap.sh - a fast way to see the full shape of a role before diving into any one topic.', 'https://roadmap.sh', null, 112)
on conflict (id) do nothing;

-- ============================================================
-- 6) Named Collections (admin-curated, distinct from the fixed category grid)
-- ============================================================

insert into public.collections (slug, name, description, icon, difficulty, estimated_learning_time, display_order, visible)
values
  ('ai-agents-toolkit', 'AI Agents Toolkit', 'Frameworks and SDKs for building LLM-powered agents and applications.', '🤖', 'intermediate', '2-4 weeks', 1, true),
  ('developer-productivity-picks', 'Developer Productivity', 'Tools that make everyday development faster - package managers, bundlers, linters, formatters.', '⚡', 'beginner', '1 week', 2, true),
  ('frontend-essentials', 'Frontend Essentials', 'The frameworks and libraries most production web UIs are built on today.', '🎨', 'intermediate', '4-8 weeks', 3, true),
  ('backend-frameworks', 'Backend Frameworks', 'Server-side frameworks across Node.js, Go, and Python for building real APIs.', '🗄️', 'intermediate', '3-6 weeks', 4, true),
  ('cloud-infrastructure', 'Cloud & Infrastructure', 'Tools for running and managing workloads in the cloud - orchestration, IaC, service mesh.', '☁️', 'advanced', '6-10 weeks', 5, true),
  ('devops-toolkit', 'DevOps Toolkit', 'Containerization, monitoring, and alerting tools for operating real systems.', '🚀', 'intermediate', '4-6 weeks', 6, true),
  ('security-toolkit', 'Security Toolkit', 'Practical security references and tools for finding and fixing vulnerabilities.', '🔒', 'intermediate', '3-5 weeks', 7, true),
  ('mobile-development', 'Mobile Development', 'Cross-platform and native frameworks for building iOS and Android apps.', '📱', 'intermediate', '4-8 weeks', 8, true),
  ('database-essentials', 'Database Essentials', 'Database engines and ORMs for storing and querying application data.', '🛢️', 'intermediate', '3-6 weeks', 9, true),
  ('open-source-essentials', 'Open Source Essentials', 'Foundational, widely-adopted open-source projects every developer should recognize.', '⭐', 'beginner', '2-4 weeks', 10, true),
  ('learning-resources', 'Learning Resources', 'Free, structured references for leveling up - roadmaps, primers, and full curricula.', '📚', 'beginner', '2-4 weeks', 11, true)
on conflict (slug) do nothing;

-- Membership: link each new collection to its matching curated repos.
-- Written as a DO block so it can look up each collection's generated
-- uuid by slug and insert memberships in one pass, safe to re-run
-- (ON CONFLICT DO NOTHING on the join table's composite PK).
do $$
declare
  col_id uuid;
begin
  select id into col_id from public.collections where slug = 'ai-agents-toolkit';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'langchain-ai/langchain', 1), (col_id, 'vercel/ai', 2), (col_id, 'openai/openai-python', 3),
      (col_id, 'huggingface/transformers', 4), (col_id, 'microsoft/autogen', 5), (col_id, 'crewAIInc/crewAI', 6)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'developer-productivity-picks';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'oven-sh/bun', 1), (col_id, 'denoland/deno', 2), (col_id, 'vitejs/vite', 3),
      (col_id, 'pnpm/pnpm', 4), (col_id, 'vercel/turborepo', 5), (col_id, 'eslint/eslint', 6), (col_id, 'prettier/prettier', 7)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'frontend-essentials';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'facebook/react', 1), (col_id, 'vercel/next.js', 2), (col_id, 'vuejs/vue', 3),
      (col_id, 'sveltejs/svelte', 4), (col_id, 'angular/angular', 5), (col_id, 'tailwindlabs/tailwindcss', 6)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'backend-frameworks';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'nestjs/nest', 1), (col_id, 'expressjs/express', 2), (col_id, 'fastify/fastify', 3),
      (col_id, 'gin-gonic/gin', 4), (col_id, 'django/django', 5), (col_id, 'nodejs/node', 6)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'cloud-infrastructure';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'kubernetes/kubernetes', 1), (col_id, 'hashicorp/terraform', 2), (col_id, 'helm/helm', 3), (col_id, 'istio/istio', 4)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'devops-toolkit';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'moby/moby', 1), (col_id, 'grafana/grafana', 2), (col_id, 'prometheus/prometheus', 3)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'security-toolkit';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'OWASP/CheatSheetSeries', 1), (col_id, 'aquasecurity/trivy', 2), (col_id, 'zaproxy/zaproxy', 3), (col_id, 'rapid7/metasploit-framework', 4)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'mobile-development';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'flutter/flutter', 1), (col_id, 'facebook/react-native', 2), (col_id, 'JetBrains/kotlin', 3), (col_id, 'apple/swift', 4)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'database-essentials';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'postgres/postgres', 1), (col_id, 'supabase/supabase', 2), (col_id, 'prisma/prisma', 3),
      (col_id, 'drizzle-team/drizzle-orm', 4), (col_id, 'redis/redis', 5)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'open-source-essentials';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'facebook/react', 1), (col_id, 'nodejs/node', 2), (col_id, 'kubernetes/kubernetes', 3),
      (col_id, 'postgres/postgres', 4), (col_id, 'moby/moby', 5), (col_id, 'microsoft/vscode', 6)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'learning-resources';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'freeCodeCamp/freeCodeCamp', 1), (col_id, 'kamranahmedse/developer-roadmap', 2), (col_id, 'donnemartin/system-design-primer', 3)
    on conflict do nothing;
  end if;
end $$;
