# Vercel Performance Audit — `/article/[slug]` & `/category/[slug]`

**Date:** 2026-07-27
**Trigger:** ~49,000 Vercel Function invocations / 12h, 3h02m of 4h Fluid Active CPU budget consumed, average CPU/invocation only ~17ms, 0% error rate. Most-invoked routes: `/category/[slug]`, `/article/[slug]`.
**Constraint honored throughout:** no UI, styling, or behavior changes — every fix below is byte-for-byte identical output, just cheaper to produce.

## 1. The root cause: every route in this app is dynamically rendered, not just article/category

The average CPU per invocation (~17ms) is already low. The 3h/4h budget burn is being driven almost entirely by **invocation volume**, not per-request cost — which means the real question isn't "why is this page slow," it's "why does this page run as a server function on literally every single pageview instead of being served as a cached/static asset."

The answer is architectural, and it's not specific to article/category — it applies to **every route in the app**:

`src/app/layout.tsx` (the root layout, which wraps every page) does two things on every request:

- `createClient()` → `supabase.auth.getSession()` — resolves the signed-in session so the Header never flashes "Sign In" before switching to the real profile menu.
- `resolveServerLocale()` (`src/i18n/resolve-locale.server.ts`) — reads the user's saved language, falling back to the `virexa_locale` cookie.

Both of these call Next.js's `cookies()` API. Next.js's rendering model (this project is on Next.js 16, using the pre-Cache-Components/pre-PPR "previous model" — `cacheComponents` is not enabled in `next.config.ts`) has one hard rule: **if any component anywhere in a route's render tree reads `cookies()`, `headers()`, or `searchParams`, the entire route is forced into dynamic (SSR-per-request) rendering.** There is no partial exception for `<Suspense>` boundaries in this model — that only applies once Cache Components/PPR is turned on (see §5).

Because the root layout — which wraps *every* page, not just article/category — reads cookies unconditionally, **every route in Virexa is already fully dynamic**, regardless of whether the leaf page itself sets `export const revalidate` or uses `generateStaticParams`. `/category/[slug]` even has a `generateStaticParams()` listing all real category slugs today — it has no effect, because the layout above it already opted the whole tree out of static generation. This is the literal answer to audit goals #1, #7, and #8: article and category pages render on every request because *the app has no static/ISR-eligible routes at all* under its current root layout, and that's why invocation count scales 1:1 with pageviews with no caching layer to absorb repeat traffic.

**This was not changed in this pass.** Fixing it requires choosing between two real trade-offs, both of which are architectural decisions the user should make deliberately rather than have made silently:

- **Option A — adopt Cache Components (`cacheComponents: true`).** This is Next 16's replacement for ISR/PPR-as-experimental: it makes Partial Prerendering the default, lets a route emit a static HTML shell immediately while cookie-dependent slices (the Header's auth state, the locale) stream in separately, and lets data-layer functions opt into `'use cache'`. This is the "correct," forward-compatible fix and would cut invocation count dramatically — but it requires auditing and annotating the data-fetching layer app-wide (every service function either needs `'use cache'` or to be provably deterministic/synchronous, or the build fails with a "blocking route" error), plus real end-to-end testing. That's a dedicated migration project, not a "safe, automatic" change to slip into a performance-tuning pass.
- **Option B — stop reading cookies in the root layout.** Auth state and locale would need to resolve client-side instead of server-side, which reintroduces the exact "Sign In → Profile" flash and locale flash this app was explicitly built to avoid (see the doc comments in `layout.tsx` and `resolve-locale.server.ts`). That's a functionality change, which the audit request explicitly ruled out.

**Recommendation:** treat Option A as a follow-up project once you're ready to sign off on the migration effort and testing surface. I did not start it in this pass — it's too large and too risky to qualify as a "safe optimization" to auto-implement.

## 2. What was fixed in this pass (implemented, safe, zero behavior change)

Since invocation count can't drop without the architectural change above, this pass focused on the other levers the audit asked for: cutting duplicate Supabase reads and unnecessary CPU work on every one of those (unavoidably dynamic) invocations.

### 2a. `generateMetadata()` was duplicating the main page fetch

Every dynamic page's `generateMetadata()` and its default page component both run as part of the same request, and three of them were independently re-fetching the same row instead of sharing one lookup:

| Route | Function | Before | After |
|---|---|---|---|
| `/article/[slug]` | `getArticleDetail` | 2 full reads (article + AI enrichment + metrics) per pageview | 1, shared via React `cache()` |
| `/developer-hub/github/[slug]` | `getGithubRepoBySlug` | 2 reads per pageview | 1, shared via React `cache()` |
| `/developer-hub/releases/[slug]` | `getReleaseDetail` | 2 reads per pageview | 1, shared via React `cache()` |

`getFeaturedArticle`, `getFeaturedArticles`, and the shared `getRepositories()` client factory were already using this exact pattern — these three functions just hadn't been wrapped yet. This directly satisfies audit goal #5 ("generateMetadata should not duplicate expensive work") and is a pure win: identical output, half the Supabase round trips on every article and release/repo detail pageview.

Files changed: `src/services/articles/article-read-service.ts`, `src/services/developer-hub/github-explorer-service.ts`, `src/services/developer-hub/release-detail-service.ts`.

### 2b. Category page was paying for data it never displays

`/category/[slug]`'s sidebar "Related Categories" list calls `getTrendingCategories(12)` and only ever reads `name`/`icon`/`count` off the result — but `getTrendingCategories` also runs a 14-day, up-to-3000-row `listPublishedBetween` query and buckets it per category to compute a sparkline/trend-direction/trend-percent that the category page's sidebar doesn't render at all (only the homepage's Trending Topics widget uses that part).

Added `getActiveCategoryCounts()` — the same real, count-descending ranking across all 12 canonical categories, minus the sparkline query and bucketing pass — and pointed the category page at it instead. Selection and ordering are identical (both rank by the same underlying per-category count), so this is a pure cost cut: one large query and a per-request O(3000 × 12) bucketing loop removed from every category page view.

Files changed: `src/services/articles/article-read-service.ts`, `src/app/category/[slug]/page.tsx`.

### 2c. Bot/crawler traffic was inflating `article_metrics.view_count`

Added `src/lib/bots/is-bot-request.ts` — a `User-Agent` pattern match covering search engine crawlers (Googlebot, Bingbot, Slurp, DuckDuckBot, Baidu, Yandex, Naver), AI/LLM crawlers (GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-Web, Anthropic-AI, PerplexityBot, Google-Extended, Bytespider, Amazonbot, Applebot, meta-externalagent, cohere-ai), social link-preview bots (Facebook, Slack, Discord, Telegram, WhatsApp, LinkedIn), SEO/uptime tooling (Ahrefs, Semrush, Majestic, UptimeRobot, Pingdom), and generic scripted clients (curl, wget, python-requests, headless browsers).

`/article/[slug]` now reads the request's `User-Agent` (via `headers()`, which is already read elsewhere in the same render tree, so this adds no new dynamic-rendering cost) and skips `incrementArticleView()` when it matches. The page renders identically for a crawler — this only gates the metrics *write*, satisfying audit goal #6. It fails open (an unrecognized UA still counts as a view, same as today), since a false positive here would corrupt a number shown directly to users ("N views" on the article and the homepage's Most Read widget) — worse than the status quo of slightly bot-inflated counts.

Files changed: `src/lib/bots/is-bot-request.ts` (new), `src/app/article/[slug]/page.tsx`.

### 2d. Swept for the same duplicate-fetch pattern elsewhere

Checked every route with a `generateMetadata()` export (`/article/[slug]`, `/category/[slug]`, `/developer-hub/github/[slug]`, `/developer-hub/releases/[slug]`) — `/category/[slug]`'s metadata only reads static taxonomy data (no DB call), so it wasn't a duplicate-fetch case. Also checked `/search` and the News Explorer data layer for redundant per-request calls; none found beyond what's already fixed above.

## 3. What was verified

- `npx tsc --noEmit` — clean, no type errors introduced.
- Manual review of every diff against the existing codebase conventions (same `cache()` pattern already used by `getFeaturedArticle`/`getRepositories`, same "never throw, fail open" error handling, same doc-comment style).
- `eslint` could not be run to completion in this sandbox within the available time budget (the project's flat config appears to do type-aware linting across the whole project, which timed out); `tsc` passing and the mechanical nature of the edits (adding `cache()` wrappers, one new pure utility file, one new lightweight query function) make a lint regression unlikely, but worth a real `npm run lint` pass before merging.
- No UI, route, prop, or data shape changed — every touched function returns exactly what it returned before.

## 4. Expected impact

- **CPU per invocation** on `/article/[slug]`: roughly halves the Supabase work per request (one round trip instead of two for the primary article read).
- **CPU per invocation** on `/category/[slug]`: removes one large (up to 3000-row) query plus its in-memory bucketing pass per request — this was likely the single most expensive part of that route given `getTrendingCategories`'s doc comments describe it as intentionally more expensive than the per-category count queries.
- **`article_metrics.view_count` accuracy**: crawler traffic no longer inflates it (indirectly reduces load too, since it's one fewer metrics write per bot hit).
- **Invocation count**: unchanged by this pass — see §1. That number only drops once article/category (and every other route) can be served from a static shell or ISR cache, which requires the layout-level decision above.

## 5. Next step this audit surfaced but did not act on

If reducing invocation count itself (not just CPU per invocation) is the priority, the next conversation should be: "let's scope the Cache Components migration." Concretely that means enabling `cacheComponents: true`, adding `'use cache'` + `cacheLife()`/`cacheTag()` to the read-heavy service functions in `article-read-service.ts`, wrapping the root layout's auth/locale resolution in `<Suspense>` so it streams instead of blocking the whole shell, and validating the build (`next build` reports which routes prerendered vs. stayed dynamic) plus manual QA of the no-flash auth/locale behavior before shipping. Happy to scope and execute that as its own tracked piece of work.
