import { TTLCache } from "@/lib/news";
import { newsAggregator } from "@/services/news/aggregator-instance";
import type { NewsArticle } from "@/types/news";

/**
 * Synchronous, always-safe access to live (RSS/API-sourced) articles for
 * code that isn't async — namely `src/data/search.ts`, `src/data/categories.ts`,
 * `src/data/latestNews.ts`, and `src/data/most-read.ts`, which existing
 * pages already call synchronously and which must not become async (that
 * would mean touching every page that calls them).
 *
 * Backed by `TTLCache`'s stale-while-revalidate mode: `getLiveArticlesSync()`
 * always returns immediately (an empty array before the first successful
 * fetch, otherwise the last successful result even if it's gone stale)
 * and, once the cache is older than `TTL_MS`, transparently kicks off a
 * background refresh - never blocking the caller and never throwing. A
 * failed refresh is logged and simply leaves the previous (possibly
 * empty) cache in place, which is exactly the "provider outage never
 * reaches the UI" behavior this pipeline needs.
 */
const TTL_MS = 5 * 60 * 1000;

const cache = new TTLCache<NewsArticle[]>(TTL_MS);

/**
 * Returns the current cached live articles and, if the cache is stale,
 * triggers a background refresh for next time. Never throws, never
 * blocks on network I/O.
 */
export function getLiveArticlesSync(): NewsArticle[] {
  const articles = cache.getStaleWhileRevalidate(
    () => newsAggregator.fetchArticles(),
    (error) => console.error("[live-articles] refresh failed, keeping previous cache:", error),
    (value) => console.info(`[live-articles] refreshed cache: ${value.length} article(s).`)
  );
  return articles ?? [];
}

/**
 * Forces an immediate, blocking refresh of this same cache and returns
 * the fresh result - used by the runtime layer's `cache-refresh`
 * pipeline step (`runtime/pipeline/steps/finalize-steps.ts`) and
 * `CacheRefreshJob` so a scheduled run doesn't have to wait for the
 * next page view's stale-while-revalidate trigger. Purely additive: the
 * existing `getLiveArticlesSync()` behavior/signature above is
 * unchanged, this just exposes a second, explicit way to update the
 * same underlying `TTLCache` instance.
 */
export async function refreshLiveArticlesCache(): Promise<NewsArticle[]> {
  const articles = await newsAggregator.fetchArticles();
  cache.set(articles);
  return articles;
}

/** Read-only snapshot of this cache's freshness/size - used by the runtime health monitor to report on the "Cache" check without duplicating `TTLCache`'s internals. */
export function getLiveArticlesCacheStatus(): { isStale: boolean; size: number } {
  return { isStale: cache.isStale, size: cache.peek()?.length ?? 0 };
}
