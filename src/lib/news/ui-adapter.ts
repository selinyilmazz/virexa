import type { NewsArticle } from "@/types/news";
import type { CategoryNewsItem } from "@/data/categories";
import { formatPublishedDate } from "@/lib/news/date-format";

/**
 * Adapts a normalized `NewsArticle` (from `NewsAggregator`) into the
 * `CategoryNewsItem` shape the existing mock-data-driven UI already
 * consumes (`NewsCard`, category grids, search results). This is the
 * only place that couples the news pipeline to the UI's existing data
 * shape — see `src/data/search.ts` and `src/data/categories.ts` for
 * where it's used to merge live articles alongside mock ones.
 */
export function toCategoryNewsItem(article: NewsArticle): CategoryNewsItem {
  return {
    slug: article.slug,
    image: article.image,
    category: article.category,
    title: article.title,
    description: article.summary,
    source: article.source.name,
    publishedDate: formatPublishedDate(article.publishedAt),
    isBookmarked: false,
  };
}
