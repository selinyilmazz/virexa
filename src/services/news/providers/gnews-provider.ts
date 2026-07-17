import type { NewsProviderId, ProviderNewsItem } from "@/types/news";
import type { NewsProvider } from "@/services/news/providers/news-provider.interface";

/**
 * Integrates with GNews.io (https://gnews.io).
 *
 * Not implemented yet, same pattern as `NewsAPIProvider`: resolves to an
 * empty list until a real HTTP integration is built, so it's always safe
 * to register with the aggregator regardless of configuration state.
 *
 * Next phase: call the GNews `/v4/search` or `/v4/top-headlines` endpoint
 * with `this.apiKey` and map results into `ProviderNewsItem`.
 */
export class GNewsProvider implements NewsProvider {
  readonly id: NewsProviderId = "gnews";
  readonly name = "GNews";

  constructor(private readonly apiKey: string | undefined) {}

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async fetchArticles(): Promise<ProviderNewsItem[]> {
    if (!this.isConfigured) {
      return [];
    }

    // TODO(next-phase): call GNews.io and map its response to ProviderNewsItem[].
    return [];
  }
}
