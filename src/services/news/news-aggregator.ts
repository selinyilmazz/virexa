import {
  dedupeArticles,
  getSourceById,
  makeUniqueSlug,
  normalizeCategory,
  resolveArticleImage,
  slugify,
  buildArticleId,
} from "@/lib/news";
import type { FetchArticlesParams, NewsArticle, ProviderNewsItem } from "@/types/news";
import type { NewsProvider } from "@/services/news/providers/news-provider.interface";

/**
 * Normalizes one raw provider item into the final `NewsArticle` shape:
 * resolves its source, maps its free-text category into the fixed
 * taxonomy, fills in a fallback image when none was supplied, defaults
 * language/country from the source when the provider didn't specify
 * them, and derives a slug (uniqueness against sibling articles is
 * enforced by the caller via `usedSlugs`). Items whose `sourceId` isn't
 * in the source registry are dropped with a warning rather than
 * crashing the whole aggregation run — an unknown source means the item
 * can't be trusted or displayed correctly yet.
 */
function normalizeProviderItem(
  item: ProviderNewsItem,
  fetchedAt: string,
  usedSlugs: Set<string>
): NewsArticle | undefined {
  const source = getSourceById(item.sourceId);
  if (!source) {
    console.warn(`[NewsAggregator] Skipping article from unknown source "${item.sourceId}": ${item.title}`);
    return undefined;
  }

  const category = normalizeCategory(item.category);
  const slug = makeUniqueSlug(slugify(item.title), usedSlugs);

  return {
    id: buildArticleId(source.id, slug),
    slug,
    title: item.title,
    summary: item.summary,
    content: item.content,
    url: item.url,
    image: resolveArticleImage(item.image, category),
    category,
    tags: item.tags ?? [],
    author: item.author,
    source,
    publishedAt: item.publishedAt,
    fetchedAt,
    language: item.language ?? source.language,
    country: item.country ?? source.country,
  };
}

/**
 * Aggregates articles across every registered `NewsProvider`, normalizes
 * them into `NewsArticle`, removes duplicates, and returns them sorted by
 * recency. This is the only entry point UI or API code should use for
 * reading news — nothing outside this file should talk to a provider
 * directly (see DESIGN.md → "News Architecture").
 *
 * Provider failures are isolated: if one provider's `fetchArticles` call
 * rejects, its articles are simply omitted and the rest of the pipeline
 * continues.
 */
export class NewsAggregator {
  constructor(private readonly providers: NewsProvider[]) {}

  async fetchArticles(params?: FetchArticlesParams): Promise<NewsArticle[]> {
    const fetchedAt = new Date().toISOString();

    const results = await Promise.allSettled(this.providers.map((provider) => provider.fetchArticles(params)));

    const rawItems: ProviderNewsItem[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        rawItems.push(...result.value);
      } else {
        const provider = this.providers[index];
        console.error(`[NewsAggregator] Provider "${provider.id}" failed:`, result.reason);
      }
    });

    const usedSlugs = new Set<string>();
    const normalized = rawItems
      .map((item) => normalizeProviderItem(item, fetchedAt, usedSlugs))
      .filter((article): article is NewsArticle => article !== undefined);

    const deduped = dedupeArticles(normalized);

    return deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }
}
