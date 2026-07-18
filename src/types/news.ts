/**
 * Shared domain types for Virexa's news infrastructure.
 *
 * This module is the single source of truth for how a "news article" is
 * represented once it leaves a provider and enters the aggregation
 * pipeline. UI mock data under `src/data/*` intentionally does NOT use
 * these types directly — it consumes adapted output via
 * `src/lib/news/ui-adapter.ts` (see DESIGN.md -> "News Architecture").
 */

/** Author of an article, when a provider exposes one. */
export type Author = {
  name: string;
  avatar?: string;
  bio?: string;
};

/**
 * A publisher of news (wire service, outlet, or an AI lab's own blog).
 *
 * `official` marks sources that are the primary/first-party origin of a
 * story (e.g. a company publishing on its own blog) as opposed to
 * third-party journalism covering that story.
 */
export type Source = {
  /** Stable, kebab-case identifier used as a lookup key (e.g. "the-verge"). */
  id: string;
  name: string;
  website: string;
  /** Path to a logo asset. Resolve via `getSourceLogo()`, which falls back to a default. */
  logo?: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "US", "GB". */
  country: string;
  /** BCP 47 language tag, e.g. "en". */
  language: string;
  /** 0-100 editorial trust score used for ranking and future weighting. */
  trustScore: number;
  official: boolean;
};

/**
 * Normalized category taxonomy that every provider's raw category label
 * gets mapped into. Kept intentionally small and stable — see
 * `src/lib/news/category-mapper.ts` for the alias table.
 */
export type Category =
  | "Technology"
  | "Business"
  | "AI"
  | "Games"
  | "World"
  | "Science"
  | "Security"
  | "Startup"
  | "Programming"
  | "Mobile"
  | "Robotics"
  | "Space";

export type Tag = string;

/**
 * The normalized, de-duplicated article shape produced by
 * `NewsAggregator`. This is what downstream code (future API routes,
 * Supabase writes, UI adapters) should consume.
 */
export type NewsArticle = {
  /** Stable id derived from source + slug, safe to use as a React key or DB key. */
  id: string;
  /** Globally unique, SEO-friendly slug (see `src/lib/news/slug.ts`). */
  slug: string;
  title: string;
  summary: string;
  content?: string;
  url: string;
  /**
   * Optional discussion/comments page URL, distinct from `url` above.
   * `url` is always the article's own destination (the story a provider
   * links to); `discussionUrl` is only populated by providers that ALSO
   * have their own separate discussion thread for that story - today,
   * only `HackerNewsProvider`, always set to the story's permanent
   * `https://news.ycombinator.com/item?id=<id>` page. Every other
   * provider leaves this `undefined`. The article page's "Source" link
   * prefers this over `url` when present (see `article-read-service.ts`),
   * so a link labeled "Hacker News" always opens Hacker News's own
   * discussion - never whatever external site (including, sometimes, a
   * Reddit thread) the story itself happens to link to.
   */
  discussionUrl?: string;
  /** Always populated — falls back to a category-based default image (see `image-fallback.ts`). */
  image: string;
  /** Which stage of the image pipeline supplied `image` - 'provider' (the source's own feed/API image, including any og:image already merged in upstream by that provider) | 'stock:pexels' | 'stock:unsplash' | 'stock:pixabay' | 'stock:wikimedia' | 'placeholder'. Observability only, see `lib/news/stock-image-provider.ts`. */
  imageSource: string;
  category: Category;
  tags: Tag[];
  author?: Author;
  source: Source;
  /** ISO 8601 timestamp of original publication. */
  publishedAt: string;
  /** ISO 8601 timestamp of when Virexa's pipeline fetched this item. */
  fetchedAt: string;
  /** BCP 47 language tag; defaults to the source's language when a provider omits it. */
  language: string;
  /** ISO 3166-1 alpha-2 country code; defaults to the source's country when a provider omits it. */
  country: string;
  /** Resolved once at normalization time via `getSourceLogo()` - always a renderable path, never missing. */
  sourceLogo: string;
  /** Estimated minutes to read, derived from word count (see `lib/news/reading-time.ts`). Always >= 1. */
  readingTime: number;
  /** 0-100 editorial trust score for this article (see `lib/news/trust-score.ts`) - currently mirrors `source.trustScore`, kept as its own field so a future per-article adjustment doesn't require touching every consumer. */
  trustScore: number;
  /** 0-100 relative "how hot is this right now" score (see `lib/news/trending-score.ts`). Recomputed on every aggregation pass, so it decays as an article ages even if nothing else changes. */
  trendingScore: number;
  /**
   * Optional raw community-engagement signal from a provider that has
   * one (e.g. Hacker News's `score`/points) - kept separate from
   * `trustScore`/`trendingScore` since it's a provider-native number,
   * not something Virexa computed. Blended into `trendingScore` via
   * `TrendingSignals.engagementScore` (see `lib/news/trending-score.ts`)
   * both at initial normalization AND whenever trending scores are
   * later recomputed (`runtime/pipeline/steps/finalize-steps.ts`), so
   * the signal survives beyond the first fetch. `undefined` for
   * providers that don't expose an equivalent metric (RSS, NewsAPI,
   * GNews) - those are entirely unaffected by this field's addition.
   */
  engagementScore?: number;
};

/**
 * Raw article shape as returned directly by a `NewsProvider`, before
 * category normalization, slug/id generation, and source enrichment.
 * `category` here is whatever free-text label the provider used
 * ("Generative AI", "Machine Learning", ...).
 */
export type ProviderNewsItem = {
  title: string;
  summary: string;
  content?: string;
  url: string;
  /** See `NewsArticle.discussionUrl` - only ever set by `HackerNewsProvider`. Carried through normalization unchanged by every other provider (stays `undefined`). */
  discussionUrl?: string;
  /** Optional — missing images are filled in by the aggregator via `image-fallback.ts`. */
  image?: string;
  category: string;
  tags?: Tag[];
  author?: Author;
  /** Key into the source registry (`src/lib/news/sources.ts`). */
  sourceId: string;
  publishedAt: string;
  /** Optional overrides; default to the resolved source's language/country when omitted. */
  language?: string;
  country?: string;
  /** See `NewsArticle.engagementScore` - carried from provider through normalization unchanged. */
  engagementScore?: number;
};

/** Identifiers for the built-in provider implementations. */
export type NewsProviderId = "manual" | "rss" | "newsapi" | "gnews" | "hn";

/** Optional query parameters supported when asking a provider for articles. */
export type FetchArticlesParams = {
  category?: string;
  query?: string;
  limit?: number;
};
