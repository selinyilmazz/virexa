import { classifyHttpStatus, fetchWithTimeout, findSourceIdByName } from "@/lib/news";
import type { FetchArticlesParams, NewsProviderId, ProviderNewsItem } from "@/types/news";
import type { NewsProvider } from "@/services/news/providers/news-provider.interface";

const REQUEST_TIMEOUT_MS = 8000;
const BASE_URL = "https://newsapi.org/v2/everything";
/** Used when the caller doesn't ask for a specific category/query - a broad net over Virexa's beat. */
const DEFAULT_QUERY = "technology OR artificial intelligence OR startup";

type NewsApiArticle = {
  source?: { id?: string | null; name?: string | null };
  author?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  urlToImage?: string | null;
  publishedAt?: string | null;
  content?: string | null;
};

type NewsApiResponse = {
  status: "ok" | "error";
  totalResults?: number;
  articles?: NewsApiArticle[];
  code?: string;
  message?: string;
};

function toProviderItem(article: NewsApiArticle, fallbackCategory: string): ProviderNewsItem | undefined {
  if (!article.title || !article.url || !article.publishedAt) {
    // Missing a field this pipeline can't safely default - skip rather than let bad data through.
    return undefined;
  }
  return {
    title: article.title,
    summary: article.description ?? "",
    content: article.content ?? undefined,
    url: article.url,
    image: article.urlToImage ?? undefined,
    category: fallbackCategory,
    tags: [],
    author: article.author ? { name: article.author } : undefined,
    sourceId: findSourceIdByName(article.source?.name),
    publishedAt: article.publishedAt,
  };
}

/**
 * Integrates with NewsAPI.org (https://newsapi.org/docs/endpoints/everything).
 *
 * Safe to register with the aggregator regardless of configuration:
 * `fetchArticles` resolves to `[]` (never throws) whenever `NEWS_API_KEY`
 * is unset, and every failure mode below (timeout, rate limit, server
 * error, malformed response) is caught and logged rather than
 * propagated - one provider misbehaving never breaks aggregation for
 * the others. The moment a real key is set in the environment, this
 * starts returning real results with no code changes.
 */
export class NewsAPIProvider implements NewsProvider {
  readonly id: NewsProviderId = "newsapi";
  readonly name = "NewsAPI";

  constructor(private readonly apiKey: string | undefined) {}

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async fetchArticles(params?: FetchArticlesParams): Promise<ProviderNewsItem[]> {
    if (!this.apiKey) {
      return [];
    }

    const query = params?.query || params?.category || DEFAULT_QUERY;
    const pageSize = Math.min(Math.max(params?.limit ?? 20, 1), 100);

    const url = new URL(BASE_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", String(pageSize));

    try {
      const response = await fetchWithTimeout(
        url.toString(),
        { headers: { "X-Api-Key": this.apiKey } },
        REQUEST_TIMEOUT_MS
      );

      if (!response.ok) {
        const kind = classifyHttpStatus(response.status);
        const body = (await response.json().catch(() => null)) as NewsApiResponse | null;
        console.error(
          `[NewsAPIProvider] Request failed (${kind}, HTTP ${response.status}): ${body?.message ?? response.statusText}`
        );
        return [];
      }

      const data = (await response.json()) as NewsApiResponse;
      if (data.status !== "ok" || !data.articles) {
        console.error(`[NewsAPIProvider] API returned an error response: ${data.message ?? "unknown error"}`);
        return [];
      }

      const fallbackCategory = params?.category ?? "Technology";
      return data.articles
        .map((article) => toProviderItem(article, fallbackCategory))
        .filter((item): item is ProviderNewsItem => item !== undefined);
    } catch (error) {
      // Covers `ProviderHttpError` (timeout/network) from `fetchWithTimeout`
      // and any unexpected error parsing the response body.
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`[NewsAPIProvider] Failed to fetch articles: ${reason}`);
      return [];
    }
  }
}
