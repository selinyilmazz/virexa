# Virexa - Design Notes

## News Architecture

Virexa's real-news pipeline lives under `src/types/news.ts`,
`src/lib/news/`, and `src/services/news/`. As of this phase it is
partially live: `RSSProvider` fetches real feeds and, once cached, those
articles show up automatically in Search and Category pages alongside
the existing mock data. Home, Article, Profile, Settings, and Bookmark
still read only from `src/data/*` mock data - untouched by this work.

### Layers

- **`src/types/news.ts`** - the shared domain model: `Article`
  (`NewsArticle`), `Source`, `Category`, `Tag`, `Author`, plus the raw
  `ProviderNewsItem` shape a provider returns before normalization. Every
  `NewsArticle` carries `id, slug, title, summary, content, image,
  source, category, publishedAt, author, tags, language, country, url` -
  missing provider fields (image, language, country, content) are always
  filled in with a safe default before an article leaves the aggregator.
- **`src/lib/news/`** - pure, framework-free helpers:
  - `category-mapper.ts` normalizes free-text provider categories
    ("Machine Learning", "Generative AI", ...) into the fixed taxonomy
    (`Technology`, `Business`, `AI`, `Games`, `World`, `Science`,
    `Security`, `Startup`).
  - `duplicate-detector.ts` flags the same story appearing twice, using
    URL, slug, and (same-source) title matching. No AI/embeddings yet -
    that's a deliberate future upgrade, not a gap in this phase.
  - `sources.ts` is the trust registry for every known publisher (name,
    website, country, language, `trustScore`, `official`, `logo`).
  - `source-logos.ts` resolves a source's logo, falling back to
    `/logos/default-source.svg` when the registry has none.
  - `image-fallback.ts` resolves an article's cover image, falling back
    to a per-category placeholder under `public/images/news/fallback/`
    when a provider didn't supply one.
  - `slug.ts` derives a slug from a title (`slugify`) and enforces
    uniqueness across a batch (`makeUniqueSlug` -> `openai-gpt5`,
    `openai-gpt5-2`, `openai-gpt5-3`, ...).
  - `ttl-cache.ts` is a tiny generic TTL cache (`TTLCache<V>`).
  - `date-format.ts` formats ISO timestamps the way the existing mock
    data displays dates ("May 20, 2024"), so live and mock articles are
    visually indistinguishable.
  - `xml-feed-parser.ts` is a small dependency-free RSS 2.0 / Atom
    parser (no network access was available to add an npm package in
    this environment - see "Known gaps" below).
  - `feed-sources.ts` is the registry of RSS feeds `RSSProvider` can
    read, each with an `enabled` flag.
  - `ui-adapter.ts` converts a `NewsArticle` into the `CategoryNewsItem`
    shape the existing UI already consumes - the one place the pipeline
    is coupled to the current mock data shape.
- **`src/services/news/providers/`** - one class per data source, all
  implementing the same `NewsProvider` interface (`fetchArticles`):
  `ManualProvider` (in-memory placeholder data), `RSSProvider` (real
  fetch + parse, see below), `NewsAPIProvider`, `GNewsProvider` (still
  no-ops pending API keys).
- **`src/services/news/news-aggregator.ts`** - `NewsAggregator` fans out
  to every registered provider in parallel, isolates individual provider
  failures (`Promise.allSettled`), normalizes raw items into
  `NewsArticle` (resolving `Source`, mapping category, filling
  image/language/country defaults, generating a globally unique slug),
  removes duplicates, and returns the list sorted by recency
  (`publishedAt` descending).
- **`src/services/news/aggregator-instance.ts`** exports the pre-wired
  `newsAggregator` singleton (kept in its own module, separate from the
  barrel `index.ts`, to avoid a circular import with `live-articles.ts`).
- **`src/services/news/live-articles.ts`** is the bridge into the
  existing, synchronous UI data layer: `getLiveArticlesSync()` returns
  whatever's currently cached (`[]` before the first successful fetch)
  and triggers a background refresh once the cache is older than 5
  minutes (TTL). It never blocks and never throws - a failed refresh is
  logged and the previous cache (or `[]`) keeps being served.
- **`src/lib/env.ts`** centralizes environment variables:
  `NEWS_API_KEY`, `GNEWS_API_KEY`, `THENEWS_API_KEY`, `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`. See `.env.example`. RSS needs
  none of these - feed URLs are public.

### Data flow

```
NewsProvider[] (RSS / NewsAPI / GNews / Manual)
        |  fetchArticles()
        v
NewsAggregator
  1. fetch from all providers in parallel, tolerate individual failures
  2. resolve each item's Source from the registry
  3. normalizeCategory() on the provider's raw category label
  4. resolveArticleImage() / language+country defaults
  5. slugify() + makeUniqueSlug() -> globally unique slug -> id
  6. dedupeArticles() across the merged list
  7. sort by publishedAt desc
        v
NewsArticle[]
        |  (cached, TTL 5 min)
        v
live-articles.getLiveArticlesSync()  <-- synchronous, never throws
        |  toCategoryNewsItem()
        v
src/data/search.ts (getAllSearchableItems)   src/data/categories.ts (getCategoryBySlug)
        v                                             v
  Search results include live articles         Category pages show mock + live articles,
  with zero extra code per new source          same NewsCard/pagination, no page changes
```

`search.ts` and `categories.ts` were the only files changed to wire this
in, and only additively: each already had a place that merges lists of
`CategoryNewsItem` (`getAllSearchableItems`'s `pushItem`, and
`getCategoryBySlug`'s returned `.news` array). Live articles are pushed
in through the exact same path, deduplicated by slug against the mock
items already there. No page or component was touched - if
`getLiveArticlesSync()` ever returns `[]` (cold cache, every provider
down, no internet), both functions behave exactly as they did before
this phase.

### RSS feeds

`RSSProvider` fetches each enabled feed independently with an 8s
timeout, parses it with `xml-feed-parser.ts`, and maps entries to
`ProviderNewsItem`. One feed failing (timeout, non-2xx, malformed XML)
never affects the others - `Promise.allSettled` isolates them, and every
failure logs a `[RSSProvider] Failed to fetch "<label>" (<url>): <reason>`
message to the console.

Configured in `src/lib/news/feed-sources.ts`:

| Feed | Status |
| --- | --- |
| BBC Technology | enabled |
| TechCrunch | enabled |
| GitHub Blog | enabled |
| NVIDIA Blog | enabled |
| Microsoft AI Blog | enabled |
| Reuters Technology | disabled - Reuters discontinued public RSS feeds |
| OpenAI Blog | disabled - no confirmed public RSS feed |
| Anthropic News | disabled - no confirmed public RSS feed |
| Google DeepMind Blog | disabled - no confirmed public RSS feed |

All nine are registered so the provider system demonstrably supports
them per the task brief; only the five with a confirmed, stable public
feed are actively polled. Flipping a feed to `enabled: true` (with a
working URL) is the entire integration step - no other code changes.

### Known gaps / next steps

1. **No `rss-parser`/`xml2js` dependency.** This sandbox has no network
   access for `npm install`, so feed parsing is a small hand-written
   RSS/Atom parser instead of a battle-tested library. It covers the
   standard `<item>`/`<entry>` shape (title, link, description/content,
   pubDate, enclosure/media image) but hasn't been run against live
   traffic in this environment - worth swapping for a real library or
   validating against each feed's actual output once network access is
   available.
2. **NewsAPI / GNews integration.** `NewsAPIProvider` and `GNewsProvider`
   still resolve to `[]` - implementing their HTTP calls (with
   `NEWS_API_KEY` / `GNEWS_API_KEY`) is the next concrete step.
3. **Reuters, OpenAI, Anthropic, DeepMind feeds.** No stable public RSS
   endpoint was confirmed for these four; revisit if/when they publish
   one, or add a scraping/API-based provider instead.
4. **Supabase persistence.** Articles are cached in memory only
   (`live-articles.ts`); a Supabase-backed store would survive restarts
   and let multiple app instances share one cache.
5. **Embedding-based duplicate detection** using `OPENAI_API_KEY`, for
   near-duplicate stories across sources that don't share a URL/slug or
   exact title.
