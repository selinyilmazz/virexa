import {
  calculateTrendingScore,
  dedupeArticles,
  estimateReadingTime,
  getSourceById,
  getSourceLogo,
  inferCategoryFromTitle,
  makeUniqueSlug,
  normalizeCategory,
  resolveArticleImage,
  resolveTrustScore,
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
 * them, derives a slug (uniqueness against sibling articles is enforced
 * by the caller via `usedSlugs`), and stamps the enrichment fields every
 * article is guaranteed to have: `sourceLogo`, `readingTime`,
 * `trustScore`, `trendingScore`. Items whose `sourceId` isn't in the
 * source registry are dropped with a warning rather than crashing the
 * whole aggregation run - an unknown source means the item can't be
 * trusted or displayed correctly yet.
 *
 * Category resolution prefers `inferCategoryFromTitle(item.title)` (a
 * real content signal) over `normalizeCategory(item.category)` (the
 * feed/provider's own static, often overly-broad label - see
 * `category-mapper.ts`'s doc comment on why every RSS feed is otherwise
 * permanently stuck as "Technology" or "AI"). Falls back to
 * `normalizeCategory(item.category)` unchanged whenever the title gives
 * no confident signal, so a provider that already supplies a real,
 * specific category is never second-guessed away from it for no reason.
 *
 * `item.engagementScore` (e.g. Hacker News points), when present, is
 * both carried onto the resulting `NewsArticle` unchanged AND blended
 * into the initial `trendingScore` via `TrendingSignals` - see
 * `lib/news/trending-score.ts`.
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

  const category = inferCategoryFromTitle(item.title) ?? normalizeCategory(item.category);
  const slug = makeUniqueSlug(slugify(item.title), usedSlugs);
  const trustScore = resolveTrustScore(source);

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
    sourceLogo: getSourceLogo(source),
    readingTime: estimateReadingTime(item.content, item.summary),
    trustScore,
    trendingScore: calculateTrendingScore({
      publishedAt: item.publishedAt,
      trustScore,
      source,
      signals: item.engagementScore !== undefined ? { engagementScore: item.engagementScore } : undefined,
    }),
    engagementScore: item.engagementScore,
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

    // Dedupe with the highest-trust copy of a story kept preferentially
    // (see `dedupeArticles` in duplicate-detector.ts), then present
    // newest-first regardless of which provider/order things arrived in.
    const bestFirst = [...normalized].sort((a, b) => b.trustScore - a.trustScore);
    const deduped = dedupeArticles(bestFirst);

    return deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }
}
