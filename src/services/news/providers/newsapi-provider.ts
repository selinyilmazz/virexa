import type { NewsProviderId, ProviderNewsItem } from "@/types/news";
import type { NewsProvider } from "@/services/news/providers/news-provider.interface";

/**
 * Integrates with NewsAPI.org (https://newsapi.org).
 *
 * Not implemented yet. `fetchArticles` resolves to an empty list when no
 * API key is configured, and stays a no-op even with a key present until
 * the real HTTP integration is built in a later phase - no network calls
 * happen from this class today.
 *
 * Next phase: call the NewsAPI `/v2/top-headlines` or `/v2/everything`
 * endpoint with `this.apiKey`, map each result into a `ProviderNewsItem`
 * (using the source registry to resolve `sourceId` from NewsAPI's
 * `source.name`), and handle rate limiting/pagination.
 */
export class NewsAPIProvider implements NewsProvider {
  readonly id: NewsProviderId = "newsapi";
  readonly name = "NewsAPI";

  constructor(private readonly apiKey: string | undefined) {}

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async fetchArticles(): Promise<ProviderNewsItem[]> {
    if (!this.isConfigured) {
      return [];
    }

    // TODO(next-phase): call NewsAPI.org and map its response to ProviderNewsItem[].
    return [];
  }
}
