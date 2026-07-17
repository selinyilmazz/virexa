import { newsAggregator } from "@/services/news/aggregator-instance";
import type { NewsArticle } from "@/types/news";

/**
 * Synchronous, always-safe access to live (RSS/API-sourced) articles for
 * code that isn't async — namely `src/data/search.ts` and
 * `src/data/categories.ts`, which existing pages already call
 * synchronously and which this task explicitly must not turn into async
 * functions (that would mean touching every page that calls them).
 *
 * Strategy: keep an in-memory cache of the last successful
 * `NewsAggregator.fetchArticles()` result. `getLiveArticlesSync()`
 * always returns immediately from that cache (empty array before the
 * first successful fetch) and, if the cache is older than `TTL_MS`,
 * kicks off a background refresh — never blocking the caller and never
 * throwing. A failed refresh is logged and simply leaves the previous
 * (possibly empty) cache in place, which is exactly the "mock/cached
 * data keeps working if the API fails" behavior this pipeline needs.
 */
const TTL_MS = 5 * 60 * 1000;

let cachedArticles: NewsArticle[] = [];
let lastRefreshAt = 0;
let isRefreshing = false;

function isStale(): boolean {
  return Date.now() - lastRefreshAt >= TTL_MS;
}

function refreshInBackground(): void {
  if (isRefreshing) return;
  isRefreshing = true;

  newsAggregator
    .fetchArticles()
    .then((articles) => {
      cachedArticles = articles;
      lastRefreshAt = Date.now();
      console.info(`[live-articles] refreshed cache: ${articles.length} article(s).`);
    })
    .catch((error) => {
      // Keep serving whatever was cached before (possibly nothing, on a
      // cold start) — never let a provider outage surface to the UI.
      console.error("[live-articles] refresh failed, keeping previous cache:", error);
    })
    .finally(() => {
      isRefreshing = false;
    });
}

/**
 * Returns the current cached live articles and, if the cache is stale,
 * triggers a background refresh for next time. Never throws, never
 * blocks on network I/O.
 */
export function getLiveArticlesSync(): NewsArticle[] {
  if (isStale()) {
    refreshInBackground();
  }
  return cachedArticles;
}
