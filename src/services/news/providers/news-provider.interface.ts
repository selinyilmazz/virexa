import type { FetchArticlesParams, NewsProviderId, ProviderNewsItem } from "@/types/news";

/**
 * Contract every news provider must implement. `NewsAggregator` only ever
 * talks to this interface — it never knows or cares whether an
 * implementation hits an RSS feed, a REST API, or an in-memory mock list.
 *
 * Adding a new source of articles (e.g. a "TheNewsAPIProvider") means
 * writing one class that implements this interface and registering an
 * instance with the aggregator — nothing else in the app needs to change.
 */
export interface NewsProvider {
  readonly id: NewsProviderId;
  readonly name: string;

  /**
   * Fetches raw articles from this provider. Implementations must not
   * throw for "expected" conditions like a missing API key — they should
   * resolve to an empty array instead, so one unconfigured/unavailable
   * provider never breaks aggregation for the others. `NewsAggregator`
   * additionally guards every call, so this is a belt-and-suspenders
   * contract rather than the only safety net.
   */
  fetchArticles(params?: FetchArticlesParams): Promise<ProviderNewsItem[]>;
}
