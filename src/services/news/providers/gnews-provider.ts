import { classifyHttpStatus, fetchWithTimeout, findSourceIdByName } from "@/lib/news";
import type { FetchArticlesParams, NewsProviderId, ProviderNewsItem } from "@/types/news";
import type { NewsProvider } from "@/services/news/providers/news-provider.interface";

const REQUEST_TIMEOUT_MS = 8000;
const BASE_URL = "https://gnews.io/api/v4/search";
/** Used when the caller doesn't ask for a specific category/query - a broad net over Virexa's beat. */
const DEFAULT_QUERY = "technology OR artificial intelligence OR startup";

type GNewsArticle = {
  title?: string | null;
  description?: string | null;
  content?: string | null;
  url?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  source?: { name?: string | null; url?: string | null };
};

type GNewsResponse = {
  totalArticles?: number;
  articles?: GNewsArticle[];
  errors?: string[];
};

function toProviderItem(article: GNewsArticle, fallbackCategory: string): ProviderNewsItem | undefined {
  if (!article.title || !article.url || !article.publishedAt) {
    return undefined;
  }
  return {
    title: article.title,
    summary: article.description ?? "",
    content: article.content ?? undefined,
    url: article.url,
    image: article.image ?? undefined,
    category: fallbackCategory,
    tags: [],
    sourceId: findSourceIdByName(article.source?.name),
    publishedAt: article.publishedAt,
  };
}

/**
 * Integrates with GNews.io (https://gnews.io/docs/v4#search-endpoint).
 *
 * Same safety contract as `NewsAPIProvider`: resolves to `[]` (never
 * throws) whenever `GNEWS_API_KEY` is unset, and every failure mode
 * (timeout, rate limit, server error, malformed response) is caught and
 * logged. Starts returning real results the moment a key is configured
 * - no code changes needed.
 */
export class GNewsProvider implements NewsProvider {
  readonly id: NewsProviderId = "gnews";
  readonly name = "GNews";

  constructor(private readonly apiKey: string | undefined) {}

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async fetchArticles(params?: FetchArticlesParams): Promise<ProviderNewsItem[]> {
    if (!this.apiKey) {
      return [];
    }

    const query = params?.query || params?.category || DEFAULT_QUERY;
    const max = Math.min(Math.max(params?.limit ?? 20, 1), 100);

    const url = new URL(BASE_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("lang", "en");
    url.searchParams.set("sortby", "publishedAt");
    url.searchParams.set("max", String(max));
    // GNews only accepts the key as a query param, not a header.
    url.searchParams.set("apikey", this.apiKey);

    try {
      const response = await fetchWithTimeout(url.toString(), {}, REQUEST_TIMEOUT_MS);

      if (!response.ok) {
        const kind = classifyHttpStatus(response.status);
        const body = (await response.json().catch(() => null)) as GNewsResponse | null;
        console.error(
          `[GNewsProvider] Request failed (${kind}, HTTP ${response.status}): ${body?.errors?.join(", ") ?? response.statusText}`
        );
        return [];
      }

      const data = (await response.json()) as GNewsResponse;
      if (!data.articles) {
        console.error(`[GNewsProvider] API returned no articles: ${data.errors?.join(", ") ?? "unknown response"}`);
        return [];
      }

      const fallbackCategory = params?.category ?? "Technology";
      return data.articles
        .map((article) => toProviderItem(article, fallbackCategory))
        .filter((item): item is ProviderNewsItem => item !== undefined);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`[GNewsProvider] Failed to fetch articles: ${reason}`);
      return [];
    }
  }
}
