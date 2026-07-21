# Virexa

Virexa is an AI-powered news aggregation platform built with Next.js
(App Router), TypeScript, Tailwind CSS, and Supabase. It ingests news
from RSS feeds and third-party APIs, enriches it with AI (summaries,
tags, sentiment, bias analysis), persists it to Postgres, and serves it
through a public site plus a full internal admin panel for content,
analytics, and operations.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Database](#database)
- [Admin Panel](#admin-panel)
- [Runtime / Automation Layer](#runtime--automation-layer)
- [AI Intelligence Layer](#ai-intelligence-layer)
- [Analytics](#analytics)
- [Security](#security)
- [SEO](#seo)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)

## Tech Stack

- **Framework**: Next.js (App Router), React, TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Database / Auth**: Supabase (Postgres, Row Level Security, Auth)
- **Validation**: Zod
- **News ingestion**: RSS/XML feeds, NewsAPI.org, GNews.io
- **AI providers**: OpenAI, Anthropic, or OpenRouter (pluggable, one active at a time)

No chart library, testing framework, logging library, or rate-limiting
library is used - the Admin Analytics charts, the server-side logger
convention, and the API rate limiter are all small, dependency-free,
hand-rolled implementations local to this codebase (see
[Analytics](#analytics), [Security](#security)).

## Architecture

Virexa follows a strict layered architecture. Each layer only talks to
the layer directly below it:

```
Page / Route Handler
  -> Service layer   (src/services/**)      - server-only, never throws on reads
    -> Repository layer (src/repositories/**) - typed Supabase query builders
      -> Supabase (Postgres, RLS)
```

- **Repository Pattern** (`src/repositories/`): one factory function per
  table/domain (e.g. `createArticleRepository(supabase)`), each
  returning a plain object of typed CRUD/query methods. Repositories
  never contain business logic - only data access.
- **Service Layer** (`src/services/`): server-only modules that wrap one
  or more repositories. Read services follow a strict "never throws"
  convention (catch, `console.error`, return a safe empty/`null`
  fallback) so a database or network failure degrades a page instead of
  crashing it. A few write-oriented admin services intentionally throw
  instead, since they're invoked from Route Handlers that must report
  success/failure back to the UI - this is documented per-file.
- **Runtime / Automation layer** (`src/runtime/`): an in-process job
  queue, scheduler, and health monitor that runs the news ingestion and
  AI enrichment pipeline on a schedule (see
  [Runtime / Automation Layer](#runtime--automation-layer)).
- **AI layer** (`src/services/ai/`, `src/lib/ai/`): a provider-agnostic
  interface over OpenAI/Anthropic/OpenRouter with its own cache and
  queue, used by the Runtime layer's AI jobs.
- **Admin panel** (`src/app/admin/`): a separate, role-gated layout
  shell with its own sidebar/header, sharing the same
  Repository/Service pattern as the public site (see
  [Admin Panel](#admin-panel)).

Two Supabase clients exist, deliberately kept separate:

- `src/lib/supabase/server.ts` - request-scoped, cookie-based, respects
  Row Level Security. Used for every public read and for anything
  acting as the signed-in user.
- `src/lib/supabase/service-client.ts` - service-role, bypasses RLS.
  Used only for background persistence (Runtime layer) and admin write
  routes. Returns `null` if `SUPABASE_SERVICE_ROLE_KEY` isn't set, which
  every caller treats as a normal "storage not configured" state rather
  than an error. **The service-role key must never reach the browser** -
  this client is only ever imported from server-only files.

See `DESIGN.md` for the original News Architecture design notes.

## Getting Started

Requirements: Node.js 20+, npm.

```bash
npm install
cp .env.example .env.local   # then fill in real values - see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs and
renders with **zero environment variables set** - every integration
(Supabase, news providers, AI, Runtime) is designed to no-op gracefully
when unconfigured, falling back to empty states rather than crashing.
Real content requires at least the Supabase variables below.

## Environment Variables

Full reference with descriptions lives in `.env.example` - copy it to
`.env.local` and fill in what you need. Summary:

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Correct canonical/OG URLs, sitemap | No trailing slash. Defaults to `http://localhost:3000` if unset - **must** be set in every real deployment. |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth, database, all persisted content | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth, database, all persisted content | Safe to expose publicly - constrained by RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime persistence, all Admin write actions | **Server-only. Never prefix with `NEXT_PUBLIC_`.** |
| `NEWS_API_KEY` / `GNEWS_API_KEY` / `THENEWS_API_KEY` | Extra news sources beyond RSS | Optional - RSS ingestion works without them. |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENROUTER_API_KEY` | AI enrichment (summaries, tags, sentiment, bias) | Set the key matching `AI_PROVIDER`; only one provider is active at a time. |
| `AI_PROVIDER`, `AI_MODEL`, `AI_TIMEOUT`, `AI_MAX_TOKENS`, `AI_CACHE_TTL` | AI tuning | All have sensible defaults - see `src/lib/env.ts`. |
| `CRON_SECRET` | **Production ingestion** - secures `/api/cron/news-fetch`, the real trigger on serverless hosting | Required for that route to accept any request. Random string, 16+ characters. Vercel sends it automatically as `Authorization: Bearer <value>` for Cron Jobs defined in `vercel.json`. |
| `RUNTIME_ENABLED` | In-process background job scheduler (self-hosted only - see [Known Limitations](#known-limitations)) | Master switch; defaults to `false`. Something still has to call `runtimeEngine.start()`. Not the production path on Vercel - use `CRON_SECRET` above instead. |
| `NEWSFETCH_INTERVAL`, `RSS_INTERVAL`, `NEWSAPI_INTERVAL`, `GNEWS_INTERVAL`, `HN_INTERVAL`, `AI_INTERVAL`, `CACHE_INTERVAL`, `HEALTH_INTERVAL`, `JOB_TIMEOUT`, `MAX_RETRY`, `CONCURRENCY` | In-process scheduler tuning | All have sensible defaults - see `src/runtime/config.ts`. |

**Checking what's actually configured**: `/admin/settings` (once signed
in as an admin) shows a live, read-only "Environment" category listing
exactly which of the above are set - no secret values are ever
displayed, only Configured / Not Configured status. This is the
fastest way to verify a deployment's configuration without reading
logs.

## Available Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # run a production build locally
npm run lint    # ESLint (eslint-config-next core-web-vitals + typescript)
```

Type-checking is run separately (there's no dedicated `typecheck`
script): `npx tsc --noEmit`.

## Project Structure

```
src/
  app/                  Routes (App Router) - public site + /admin + API routes
    admin/              Admin panel: dashboard, articles, sources, analytics,
                         AI, health, runtime, users, audit log, settings
    api/                Route Handlers (metrics beacon, admin write/export endpoints)
    robots.ts            Generated robots.txt
    sitemap.ts            Generated sitemap.xml
    manifest.ts           Web app manifest
    not-found.tsx / error.tsx / global-error.tsx   Error boundaries (public site)
  components/           React components, organized by feature/domain folder
  services/             Server-only service layer (see Architecture)
  repositories/         Data access layer (see Architecture)
  runtime/              Job queue, scheduler, pipeline, health monitor (see below)
  lib/                  Shared utilities: env, Supabase clients, AI helpers,
                         news helpers, admin helpers, rate limiting, validation
  types/                Shared TypeScript types, including the Supabase type shim
  data/                 Static/reference data (categories, company ticker, etc.)
  middleware.ts         Route protection (auth-gated and admin-gated paths)
supabase/
  migrations/           SQL migrations, additive-only, safe to re-run
```

## Database

Schema lives in `supabase/migrations/`, applied in order:

1. `0001_production_schema.sql` - `profiles`, `bookmarks`, `user_settings` (per-user RLS)
2. `0002_article_storage.sql` - `article_sources`, `articles`, `article_ai`, `article_metrics` (publicly readable, service-role-only writes)
3. `0003_admin_audit_log.sql` - `admin_audit_log` (RLS enabled with **no policies** - reachable only via the service-role client)

Apply migrations via the Supabase CLI or SQL editor, in filename order.
Every migration uses `IF NOT EXISTS` / `OR REPLACE` conventions, so
re-running an already-applied migration is safe.

## Admin Panel

`/admin/*` is gated by `middleware.ts`: signed-out users are redirected
to `/signin`, signed-in non-admins are redirected home. Admin status is
read from Supabase Auth's `app_metadata.role` (never `user_metadata`,
which is user-editable). Every admin write Route Handler re-checks
authorization independently (defense in depth), and every write is
recorded to the audit log.

Sections:

- **Dashboard** - key stat cards, health overview, runtime status snapshot.
- **Articles** - filter/search/paginate stored articles, read-only detail drawer, bulk trending-score refresh.
- **Sources** - manage registered news sources: active/inactive toggle, trust score, bulk actions. No delete.
- **Analytics** - summary metrics, time-series charts (hand-rolled SVG components - no chart library dependency), top lists, AI analytics, CSV export.
- **AI** - AI layer configuration and enrichment status.
- **Health** - live reachability checks for RSS/NewsAPI/GNews/AI provider/database/cache/queue.
- **Runtime** - safe, non-destructive manual triggers (run pipeline, refresh cache, recalculate trending/trust scores, retry failed jobs).
- **Users** - list/search Supabase Auth users, change role, suspend/reactivate (via Auth's native `ban_duration`, no schema change needed).
- **Audit Log** - every admin write action, actor, target, and metadata.
- **Settings** - read-only configuration and system information (versions, environment, database/runtime status).

## Runtime / Automation Layer

`src/runtime/` is an in-process job engine with a fixed set of 13 job
types (`src/runtime/types.ts`): `news-fetch`, `rss-sync`,
`newsapi-sync`, `gnews-sync`, `duplicate-detection`, `ai-summary`,
`ai-tag`, `sentiment`, `bias-analysis`, `trending`, `cache-refresh`,
`cleanup`, `health-check`.

- `runtimeEngine` (`runtime/engine.ts`) is the singleton entry point:
  `enqueueJob()`, `runJob()`, `queue.list()`, `queue.getStats()`,
  `checkHealth()`.
- The in-process scheduler (`RuntimeScheduler`, `setInterval`-based)
  never starts implicitly - `RUNTIME_ENABLED=true` alone does nothing;
  something must call `runtimeEngine.start()` on a long-lived process
  (self-hosted/Docker). Nothing in this codebase calls it automatically
  today (no `instrumentation.ts` hook) - this is a deliberate opt-in, not
  a bug, since starting it unconditionally would surprise a bare `next
  dev`/`next start`.
- On serverless platforms (Vercel), that in-process scheduler does not
  persist between invocations regardless of `RUNTIME_ENABLED` - see
  [Known Limitations](#known-limitations). **The real production
  trigger is `GET/POST /api/cron/news-fetch`** (`src/app/api/cron/news-fetch/route.ts`),
  secured by `CRON_SECRET` (`Authorization: Bearer <secret>` - the exact
  mechanism Vercel Cron Jobs use natively). `vercel.json` at the repo
  root wires a Vercel Cron Job to that route (once daily by default -
  see that file's comment for how to run it more often on a paid plan;
  Vercel's Hobby tier rejects any cron expression that fires more than
  once per day at deploy time). This one route call is sufficient on its
  own: `news-fetch` runs the full pipeline (fetch, normalize, dedupe,
  trust score, AI enrichment, trending, database persistence, cache
  refresh) - it's the only job type that writes to Supabase at all (see
  the next paragraph).
- Of the 14 job types, only `news-fetch` persists to Supabase.
  `rss-sync`/`newsapi-sync`/`gnews-sync`/`hn-sync`/`ai-summary`/`ai-tag`/
  `sentiment`/`bias-analysis` each only touch a legacy in-memory
  `live-articles` cache that no current, database-backed page reads from
  - they're independently useful for isolating one provider/capability
  while debugging, but do not by themselves keep the live site's content
  fresh. `schedule-definitions.ts` documents this in full.

## AI Intelligence Layer

`src/services/ai/` and `src/lib/ai/` provide a single interface over
three providers (OpenAI, Anthropic, OpenRouter), selected by
`AI_PROVIDER`. Every AI operation is designed to no-op (return `null`)
rather than throw when its provider's key isn't set, so the rest of the
app functions normally without AI configured - articles simply aren't
enriched with summaries/tags/sentiment/bias until it is. Results are
cached (`AI_CACHE_TTL`, default 24h) to avoid re-generating unchanged
content.

## Analytics

`/admin/analytics` reads aggregated data through the existing
repositories - there is no analytics database or third-party service.
Time-series metrics for views/bookmarks/shares are honestly documented
as best-effort where the underlying schema doesn't track history
per-day; see the doc comments in
`src/services/admin/admin-analytics-service.ts` for the exact
methodology and its limits. Charts are hand-rolled, dependency-free SVG
components (`src/components/admin/*Chart*`) since no charting library
is installed.

## Security

- **Headers**: `next.config.ts` sets `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, a restrictive
  `Permissions-Policy`, and DNS prefetch control on every response. No
  `Content-Security-Policy` is set - see the comment in `next.config.ts`
  for why, and [Known Limitations](#known-limitations).
- **Rate limiting**: `src/lib/rate-limit.ts` is a small, in-memory,
  per-process fixed-window limiter applied to the one fully public,
  unauthenticated write endpoint (`POST /api/metrics`). It does **not**
  provide a hard global limit on multi-instance/serverless deployments
  - see that file's doc comment.
- **Input validation**: every Route Handler validates its request body
  with Zod before touching any data.
- **AuthZ**: `src/lib/admin/authorization.ts` (`requireAdminUser` for
  pages, `getAdminUserOrNull` for Route Handlers) plus
  `middleware.ts` gate every admin surface. Regular auth-gated pages
  (`/bookmarks`, `/profile`, `/settings`) are gated the same way.
  Open-redirect protection on the post-sign-in `redirect` query param
  rejects both external and protocol-relative (`//host`) values.
- **Secrets**: `SUPABASE_SERVICE_ROLE_KEY` and every AI/news provider
  key are read only in `src/lib/env.ts` and only ever consumed
  server-side; `/admin/settings` reports their configured/not-configured
  status without ever displaying the values.
- **CSRF**: no explicit CSRF tokens are implemented; mutation routes
  rely on the Supabase session cookie's default `SameSite` behavior.
  If this app is ever embedded or needs cross-site form submission,
  this should be revisited.

## SEO

- `src/app/robots.ts` - disallows `/admin` and `/api`, allows everything else.
- `src/app/sitemap.ts` - static routes, all categories, and the most
  recently published 1,000 articles (see
  `getSitemapEntries()` in `article-read-service.ts` for the cap).
- `src/app/manifest.ts` - web app manifest.
- Root `metadata` (`src/app/layout.tsx`) sets `metadataBase` from
  `NEXT_PUBLIC_SITE_URL`, plus OpenGraph/Twitter card defaults;
  individual pages (article, category, search, etc.) set their own
  `title`/`description`.
- `not-found.tsx`, `error.tsx`, and `global-error.tsx` at the app root
  provide branded fallbacks instead of Next.js's defaults.

## Deployment

Designed for Vercel, but is a standard Next.js app and should run on
any Node.js host that supports the App Router.

1. Set every environment variable listed in
   [Environment Variables](#environment-variables) (at minimum
   `NEXT_PUBLIC_SITE_URL` and the three Supabase variables) in the
   platform's environment settings.
2. Apply the SQL migrations in `supabase/migrations/` to the target
   Supabase project, in order.
3. Deploy. `npm run build` / `npm run start` are the standard Next.js
   production commands.
4. Set `CRON_SECRET` (a random string of 16+ characters) in the
   platform's environment settings - this is what secures
   `/api/cron/news-fetch` AND `/api/cron/ai-enrichment` (see
   [Runtime / Automation Layer](#runtime--automation-layer)). On Vercel,
   `vercel.json`'s `crons` entry picks `news-fetch` up automatically on
   deploy (once daily - Hobby-compatible) - no extra dashboard
   configuration needed beyond setting the env var. On any other host,
   point your own scheduler (cron, GitHub Actions, etc.) at
   `POST /api/cron/news-fetch` with header
   `Authorization: Bearer <CRON_SECRET>` on whatever cadence you want.
5. **AI enrichment (`/api/cron/ai-enrichment`) is triggered by GitHub
   Actions, not `vercel.json`** - `.github/workflows/ai-enrichment.yml`
   calls it every 15 minutes. This is deliberate, not incidental:
   Vercel's Hobby plan rejects any `vercel.json` cron expression that
   fires more than once a day and fails the WHOLE deployment (every
   route, not just the offending cron entry) when it sees one - AI
   enrichment needs a much tighter cadence than news-fetch's once-daily
   schedule to clear its backlog at a reasonable pace, so it lives
   outside `vercel.json` entirely. To enable it, add two repo secrets
   under GitHub Settings > Secrets and variables > Actions:
   `PRODUCTION_URL` (the deployed site's base URL, no trailing slash)
   and `CRON_SECRET` (the exact same value set in step 4). On a Vercel
   Pro/Team plan you could instead add an `/api/cron/ai-enrichment` entry
   back into `vercel.json` at whatever frequency you want and drop the
   GitHub Actions workflow - the route itself doesn't care which
   scheduler calls it.
6. After deploying, verify `/admin/settings` shows every expected
   integration as "Configured", then either wait for the first cron
   invocation (or manually run the "AI Enrichment Cron" workflow from
   GitHub's Actions tab) or call `/api/cron/news-fetch` once by hand to
   confirm articles start appearing - `/admin/runtime`'s "Last Run"/"Last
   Success" cards and the homepage's newest article date are the two
   fastest ways to confirm it worked.

## Troubleshooting

- **"Storage is not configured" on admin writes**: `SUPABASE_SERVICE_ROLE_KEY`
  isn't set. Check `/admin/settings` -> Environment.
- **Articles never appear / stay empty**: no news source is configured
  and/or the Runtime layer's scheduler was never started. RSS feeds
  need no key; NewsAPI/GNews need their respective keys. Check
  `/admin/health` for per-provider reachability.
- **Articles appear but are never AI-enriched**: no `AI_PROVIDER` key
  is set, or `AI_PROVIDER` points at a provider whose key is empty.
  This is a supported, non-error state - the site works without it.
  Check `/admin/settings` or `/admin/health`'s "AI Provider" row.
- **Runtime Status shows "No Recent Runs" / homepage shows stale
  articles / "Added in Last 24h" is 0**: `/admin/runtime`'s status badge
  is based entirely on `runtime_job_runs` (durable, DB-backed - see
  `admin-runtime-history-service.ts`), not any in-process scheduler
  state, so this means no job of any kind has actually completed in the
  last 26 hours - a real signal, not a false alarm. Check: (1) is
  `CRON_SECRET` set and does `vercel.json` have an active Cron Job
  pointed at `/api/cron/news-fetch`; (2) is the
  `.github/workflows/ai-enrichment.yml` workflow enabled with its
  `PRODUCTION_URL`/`CRON_SECRET` repo secrets set (check the Actions tab
  for failed runs); (3) call `/api/cron/news-fetch` by hand with the
  right `Authorization: Bearer <CRON_SECRET>` header and check the JSON
  response for per-step errors. If none of that resolves it, use
  `/admin/runtime`'s "Run Pipeline" button to trigger `news-fetch`
  manually and watch for errors there instead.
- **Sitemap/canonical URLs point at `localhost:3000` in production**:
  `NEXT_PUBLIC_SITE_URL` isn't set in that environment.
- **`npm run build` fails with an SWC binary error**: this happens in
  network-restricted sandboxes that can't download the platform-native
  `@next/swc-*` binary; it is an environment limitation, not a code
  issue, and does not occur on a normal `npm install` with registry
  access (including Vercel's build environment).
- **TypeScript errors mentioning `SupabaseClient`/`auth.admin`/etc.**:
  see `src/types/supabase-shims.d.ts` - a local ambient type shim used
  in place of `@supabase/supabase-js`'s real published types (its own
  header comment explains when/how to remove it).

## Known Limitations

Honest, current gaps - not blockers to a first deploy, but worth
knowing:

- **No Content-Security-Policy header.** Deliberately not shipped
  unverified - see `next.config.ts`'s comment. Author and test one
  against the real deployed build before adding it.
- **Rate limiting is per-process, in-memory.** On a multi-instance
  deployment it does not provide a hard global cap. A shared store
  (Redis/Upstash) would be needed for a strict guarantee.
- **The in-process Runtime scheduler does not run automatically on
  serverless platforms** between invocations - production ingestion/AI
  now runs via the external `/api/cron/news-fetch` trigger + Vercel Cron
  instead (see [Deployment](#deployment)); the in-process scheduler
  remains available (and now includes `news-fetch` itself in its
  schedule) for anyone self-hosting on a persistent Node process.
- **`news-fetch` and all 9 AI enrichment jobs persist to Supabase.**
  `news-fetch` handles fetch/normalize/persist only; AI enrichment
  (Summary, TL;DR, Key Takeaways, Long Summary, Rewrite, Entities, Tags,
  Sentiment, Bias) is fully decoupled into 9 independent jobs
  (`runtime/jobs/ai-jobs.ts`), each writing real `article_ai` rows via
  `services/ai/ai-enrichment-runner.ts` - see
  [Runtime / Automation Layer](#runtime--automation-layer). The
  remaining individually-scheduled jobs (`rss-sync`/`newsapi-sync`/
  `gnews-sync`/`hn-sync`) still only touch a legacy in-memory cache
  pre-dating the Supabase-backed Article Storage layer - see
  `schedule-definitions.ts`'s doc comment. Consolidating or removing
  those is a reasonable future cleanup.
- **Vercel Hobby plan cron limits.** `vercel.json` only contains
  `news-fetch`'s once-daily schedule - Hobby rejects any cron expression
  that fires more than once a day and fails the ENTIRE deployment (every
  route) when it sees one, which is exactly what happened when AI
  enrichment's `*/15 * * * *` schedule was briefly added directly to
  `vercel.json`. AI enrichment's frequent trigger lives in GitHub Actions
  instead (`.github/workflows/ai-enrichment.yml`) for that reason - see
  [Deployment](#deployment) step 5. On Pro/Team, you can add
  `/api/cron/ai-enrichment` back into `vercel.json` at any frequency and
  drop the GitHub Actions workflow.
- **Analytics time-series data is best-effort** where the schema
  doesn't retain daily history - see
  `admin-analytics-service.ts`'s doc comments for the exact,
  per-metric methodology.
- **Admin Users Management lists up to 1,000 users** (`MAX_USERS_FETCH`
  in `admin-user-service.ts`), with search/sort/filter done in memory.
  Fine at current scale; would need a different approach at very large
  user counts.
- **`noUncheckedIndexedAccess` is not enabled** in `tsconfig.json`. It
  surfaces ~24 real (mostly low-risk) call sites across the codebase
  that assume an indexed/array access always succeeds; left disabled
  rather than blindly patched, since fixing it properly needs
  case-by-case review. `noUnusedLocals`, `noUnusedParameters`,
  `noImplicitReturns`, and `noFallthroughCasesInSwitch` are enabled and
  pass cleanly.
