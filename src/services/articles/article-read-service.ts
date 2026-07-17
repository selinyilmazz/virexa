import { cache } from "react";
import type { CategoryNewsItem } from "@/data/categories";
import type { ArticleContentBlock } from "@/data/article";
import { formatPublishedDate, getSourceById, resolveArticleImage } from "@/lib/news";
import { createClient } from "@/lib/supabase/server";
import { createArticleAIRepository } from "@/repositories/article-ai-repository";
import { createArticleMetricsRepository } from "@/repositories/article-metrics-repository";
import { createArticleRepository } from "@/repositories/article-repository";
import { createSourceRepository } from "@/repositories/source-repository";
import type { FullTextSearchParams } from "@/lib/validation/article-storage-schema";
import type { ArticleRow, StoredBias, StoredSentiment, StoredTldr } from "@/types/database";
import type { Category as NewsCategory } from "@/types/news";

/**
 * Server-only read access to the Article Storage tables
 * (`supabase/migrations/0002_article_storage.sql`) for every UI surface
 * that displays real articles (Home, Categories, Search, Article
 * Detail). This is the ONLY place page/Server-Component code should
 * call the article/AI/metrics repositories from for reads - mirrors the
 * existing "components never call a provider/repository directly"
 * convention from the News and AI layers.
 *
 * Every exported function here:
 *  - never throws - a Supabase/repository failure is caught, logged,
 *    and turned into an empty/`null` result so a page can always render
 *    a graceful fallback instead of crashing ("Repository hata verirse
 *    UI çökmeyecek").
 *  - uses the request-scoped, RLS-respecting server client
 *    (`lib/supabase/server.ts`) - reads are public per the Article
 *    Storage RLS policies, so no service-role client is needed here
 *    (that's reserved for writes - see `article-metrics-service.ts`).
 */

const getRepositories = cache(async () => {
  const supabase = await createClient();
  return {
    articles: createArticleRepository(supabase),
    ai: createArticleAIRepository(supabase),
    metrics: createArticleMetricsRepository(supabase),
    sources: createSourceRepository(supabase),
  };
});

const VALID_CATEGORIES = new Set<NewsCategory>([
  "Technology",
  "Business",
  "AI",
  "Games",
  "World",
  "Science",
  "Security",
  "Startup",
  "Programming",
  "Mobile",
  "Robotics",
  "Space",
]);

function resolveDisplayImage(row: Pick<ArticleRow, "image_url" | "category">): string {
  if (row.image_url && row.image_url.trim().length > 0) {
    return row.image_url;
  }
  const category = VALID_CATEGORIES.has(row.category as NewsCategory) ? (row.category as NewsCategory) : "Technology";
  return resolveArticleImage(undefined, category);
}

function resolveSourceName(sourceId: string): string {
  return getSourceById(sourceId)?.name ?? sourceId;
}

/** Adapts an `ArticleRow` into the `CategoryNewsItem` shape every existing card component (`NewsCard`, category grids, search results) already renders - the DB-backed counterpart to `lib/news/ui-adapter.ts`'s `toCategoryNewsItem` (which adapts the in-memory `NewsArticle` shape instead). */
function toCategoryNewsItem(row: ArticleRow): CategoryNewsItem {
  return {
    slug: row.slug,
    image: resolveDisplayImage(row),
    category: row.category,
    title: row.title,
    description: row.description,
    source: resolveSourceName(row.source_id),
    publishedDate: formatPublishedDate(row.published_at),
    isBookmarked: false,
  };
}

export type ArticlesPage = {
  items: CategoryNewsItem[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

function emptyPage(page: number, pageSize: number): ArticlesPage {
  return { items: [], total: 0, totalPages: 1, page, pageSize };
}

/**
 * Latest articles, most recently published first - backs Home's "Latest
 * News" section. `excludeSlug` (product polishing phase, area 5 -
 * "Avoid repeating the same articles everywhere") lets the caller drop
 * the Hero/Featured article from this list, since the single newest
 * article is very often also the current highest-trending one and
 * would otherwise show up twice on the homepage. Matched on `slug`
 * (not `id`) since that's what `FeaturedArticle`/`CategoryNewsItem`
 * actually carries - both are unique per article. Over-fetches by one
 * extra row specifically to absorb that exclusion without silently
 * returning fewer than `limit` items on the common case where the
 * excluded article really was in the newest page.
 */
export async function getLatestArticles(limit = 8, excludeSlug?: string): Promise<CategoryNewsItem[]> {
  try {
    const { articles } = await getRepositories();
    const result = await articles.search({ page: 1, pageSize: excludeSlug ? limit + 1 : limit });
    const items = excludeSlug ? result.items.filter((row) => row.slug !== excludeSlug) : result.items;
    return items.slice(0, limit).map(toCategoryNewsItem);
  } catch (error) {
    console.error("[article-read-service] getLatestArticles failed:", error);
    return [];
  }
}

export type FeaturedArticle = CategoryNewsItem & { hasAIInsights: boolean };

/**
 * The single highest-`trending_score` article, flagged with whether it
 * already has AI enrichment (`article_ai`) - backs Home's Hero/"Featured"
 * section. `hasAIInsights` is what lets the Hero honestly badge itself
 * "AI Recommended" instead of just "Trending" when true, folding the
 * "Featured" and "AI Recommended" homepage requirements into the one
 * existing hero slot rather than adding a new section.
 *
 * Wrapped in React's `cache()` (product polishing phase, area 5) so
 * `HeroSection`, `LatestNews`, and `MostRead` - three independent
 * Server Components that each need to know which article is currently
 * featured, in order to exclude it from their own lists - share a
 * single request-scoped call instead of tripling this query per
 * homepage render.
 */
export const getFeaturedArticle = cache(async (): Promise<FeaturedArticle | null> => {
  try {
    const { articles, ai } = await getRepositories();
    const [top] = await articles.listTopByTrending(1);
    if (!top) return null;
    const insight = await ai.getLatest(top.id);
    return { ...toCategoryNewsItem(top), hasAIInsights: insight !== null };
  } catch (error) {
    console.error("[article-read-service] getFeaturedArticle failed:", error);
    return null;
  }
});

/**
 * Ranks a trending-score candidate pool by real `view_count` (falling
 * back to `trending_score` for articles with no views yet, which is
 * every article until real traffic accrues) - backs Home's "Most Read"
 * widget. `excludeSlug` (product polishing phase, area 5) drops the
 * Hero/Featured article from consideration - it's drawn from the same
 * trending-score pool as this widget, so without exclusion it would
 * routinely also land in the Most Read top 5.
 */
export type MostReadArticle = CategoryNewsItem & { viewCount: number };

export async function getMostReadArticles(limit = 5, excludeSlug?: string): Promise<MostReadArticle[]> {
  try {
    const { articles, metrics } = await getRepositories();
    const rawPool = await articles.listTopByTrending(Math.max(limit * 4, 20) + (excludeSlug ? 1 : 0));
    const pool = excludeSlug ? rawPool.filter((row) => row.slug !== excludeSlug) : rawPool;
    if (pool.length === 0) return [];

    const metricsRows = await metrics.getManyByArticleIds(pool.map((row) => row.id));
    const viewsByArticleId = new Map(metricsRows.map((row) => [row.article_id, row.view_count]));

    const ranked = [...pool].sort((a, b) => {
      const viewsDiff = (viewsByArticleId.get(b.id) ?? 0) - (viewsByArticleId.get(a.id) ?? 0);
      return viewsDiff !== 0 ? viewsDiff : b.trending_score - a.trending_score;
    });

    return ranked
      .slice(0, limit)
      .map((row) => ({ ...toCategoryNewsItem(row), viewCount: viewsByArticleId.get(row.id) ?? 0 }));
  } catch (error) {
    console.error("[article-read-service] getMostReadArticles failed:", error);
    return [];
  }
}

/**
 * Exact, paginated "most read" listing for the dedicated `/most-read`
 * page - sorted by `trending_score` via `ArticleRepository.search()`'s
 * `sortBy` option, using the same `count: "exact"` pagination as every
 * other real listing (category, search). Deliberately a separate
 * function from `getMostReadArticles`: that one ranks a bounded
 * candidate pool by real `view_count` for a small, non-paginated Home
 * widget, while this one needs an honest `totalPages` for a real
 * paginated page, which only an exact, DB-ordered sort can provide.
 */
export async function getMostReadPage(page: number, pageSize: number): Promise<ArticlesPage> {
  try {
    const { articles } = await getRepositories();
    const result = await articles.search({ sortBy: "trending_score", page, pageSize });
    return {
      items: result.items.map(toCategoryNewsItem),
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
      page: result.page,
      pageSize: result.pageSize,
    };
  } catch (error) {
    console.error("[article-read-service] getMostReadPage failed:", error);
    return emptyPage(page, pageSize);
  }
}

export type TrendingCategoryStat = { rank: number; name: string; articleCount: string };

/** Tallies category frequency across the top-trending article pool - backs "Trending Topics" (Home sidebar + Search sidebar) with real data instead of a static topic list. */
export async function getTrendingCategories(limit = 6): Promise<TrendingCategoryStat[]> {
  try {
    const { articles } = await getRepositories();
    const pool = await articles.listTopByTrending(100);
    if (pool.length === 0) return [];

    const counts = new Map<string, number>();
    for (const row of pool) {
      counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count], index) => ({
        rank: index + 1,
        name,
        articleCount: `${count} article${count === 1 ? "" : "s"}`,
      }));
  } catch (error) {
    console.error("[article-read-service] getTrendingCategories failed:", error);
    return [];
  }
}

/** Paginated articles for one category - backs the category page's grid + `Pagination` component. */
export async function searchCategoryArticles(categoryName: string, page: number, pageSize: number): Promise<ArticlesPage> {
  try {
    const { articles } = await getRepositories();
    const result = await articles.search({ category: categoryName, page, pageSize });
    return {
      items: result.items.map(toCategoryNewsItem),
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
      page: result.page,
      pageSize: result.pageSize,
    };
  } catch (error) {
    console.error("[article-read-service] searchCategoryArticles failed:", error);
    return emptyPage(page, pageSize);
  }
}

/** Most recent articles for one category - backs the category page's "Recently Added" sidebar list. */
export async function getRecentArticlesForCategory(categoryName: string, limit = 5): Promise<CategoryNewsItem[]> {
  try {
    const { articles } = await getRepositories();
    const result = await articles.search({ category: categoryName, page: 1, pageSize: limit });
    return result.items.map(toCategoryNewsItem);
  } catch (error) {
    console.error("[article-read-service] getRecentArticlesForCategory failed:", error);
    return [];
  }
}

export type SearchSortOrder = "relevance" | "newest" | "oldest";

export type SearchQueryParams = Partial<
  Pick<FullTextSearchParams, "sourceId" | "category" | "categories" | "language" | "country" | "tag" | "dateFrom" | "dateTo">
> & {
  /** Free-text query, searched across title/description/content/tags/author/category/AI summary/TLDR/source name - see `ArticleRepository.fullTextSearch()`. Was called `title` before this became real full-text search; renamed since it's no longer a title-only filter. */
  query?: string;
  /** Result order - defaults to 'relevance' when a text query is present, 'newest' otherwise (relevance ranking has no meaning without a query). */
  sort?: SearchSortOrder;
  page?: number;
  pageSize?: number;
};

/** A search result item, same shape every other listing already renders (`NewsCard`, etc.) plus which field the query actually matched - powers the "Matched in X" badge on the search results page. Optional: the filter-only browse path (no text query - see `searchArticlesReal`) has no match field to report, since nothing was text-matched. */
export type SearchResultItem = CategoryNewsItem & { matchedIn?: string };

export type SearchArticlesPage = {
  items: SearchResultItem[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

function emptySearchPage(page: number, pageSize: number): SearchArticlesPage {
  return { items: [], total: 0, totalPages: 1, page, pageSize };
}

function hasAnyFilter(params: SearchQueryParams): boolean {
  return Boolean(
    (params.categories && params.categories.length > 0) ||
      params.category ||
      params.dateFrom ||
      params.dateTo ||
      params.tag ||
      params.sourceId ||
      params.language ||
      params.country
  );
}

/**
 * Real search for the public `/search` page, with two paths:
 *
 *  - Text query present: relevance-ranked full-text search via
 *    `ArticleRepository.fullTextSearch()` (title/description/content/
 *    tags/author/category on `articles` itself, plus AI summary/TLDR
 *    and source name - see `supabase/migrations/0004_full_text_search.sql`
 *    and `0008_search_sort_and_title_boost.sql`). `sort` maps onto the
 *    SQL function's `sort_by` ('relevance'/'newest'/'oldest').
 *  - No text query, but at least one filter (time/category/etc.) is
 *    set: a plain filtered browse listing via `ArticleRepository.search()`
 *    (no relevance ranking to speak of - sorted by publish date,
 *    'oldest' reversing the direction). This is what makes "Time
 *    filters must actually filter results" / "Category filters must
 *    work correctly together" true even when the user hasn't typed a
 *    keyword - previously this function short-circuited to an empty
 *    page whenever `query` was blank, silently ignoring every filter.
 *  - Neither a query nor any filter: empty page (the search page's
 *    "Enter a keyword or choose a filter to get started" landing
 *    state), matching the original "type something to see results"
 *    behavior for a genuinely empty search.
 *
 * Source/category(ies)/language/country/tag/date filters are ANDed
 * with the text match (or with each other, in the filter-only path).
 * `categories` (plural) is what the search page's multi-select
 * Category checkboxes use - every checked category is honored, not
 * just the first (see `0007_search_multi_category.sql`).
 */
export async function searchArticlesReal(params: SearchQueryParams): Promise<SearchArticlesPage> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const hasQuery = Boolean(params.query && params.query.trim().length > 0);

  if (!hasQuery && !hasAnyFilter(params)) {
    return emptySearchPage(page, pageSize);
  }

  try {
    const { articles } = await getRepositories();

    if (hasQuery) {
      const result = await articles.fullTextSearch({
        query: params.query as string,
        sourceId: params.sourceId,
        category: params.category,
        categories: params.categories,
        language: params.language,
        country: params.country,
        tag: params.tag,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        sortBy: params.sort ?? "relevance",
        page,
        pageSize,
      });
      return {
        items: result.items.map((row) => ({ ...toCategoryNewsItem(row), matchedIn: row.matched_in })),
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
        page: result.page,
        pageSize: result.pageSize,
      };
    }

    const result = await articles.search({
      category: params.category,
      categories: params.categories,
      tag: params.tag,
      sourceId: params.sourceId,
      language: params.language,
      country: params.country,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sortBy: "published_at",
      sortAscending: params.sort === "oldest",
      page,
      pageSize,
    });
    return {
      items: result.items.map((row) => toCategoryNewsItem(row)),
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
      page: result.page,
      pageSize: result.pageSize,
    };
  } catch (error) {
    console.error("[article-read-service] searchArticlesReal failed:", error);
    return emptySearchPage(page, pageSize);
  }
}

/** Real match counts per category slug, for the search sidebar's category filter counts. Runs one small `count`-only query per category, in parallel. */
export async function getCategoryFilterCounts(options: { slug: string; name: string }[]): Promise<Record<string, number>> {
  try {
    const { articles } = await getRepositories();
    const entries = await Promise.all(
      options.map(async ({ slug, name }) => {
        const result = await articles.search({ category: name, page: 1, pageSize: 1 });
        return [slug, result.total] as const;
      })
    );
    return Object.fromEntries(entries);
  } catch (error) {
    console.error("[article-read-service] getCategoryFilterCounts failed:", error);
    return {};
  }
}

/** Real match counts per time-range filter (e.g. "last 7 days"), for the search sidebar's time filter counts. Runs one small `count`-only query per range, in parallel. */
export async function getTimeFilterCounts(options: { id: string; maxDays: number }[]): Promise<Record<string, number>> {
  try {
    const { articles } = await getRepositories();
    const now = Date.now();
    const entries = await Promise.all(
      options.map(async ({ id, maxDays }) => {
        const dateFrom = new Date(now - maxDays * 24 * 60 * 60 * 1000).toISOString();
        const result = await articles.search({ dateFrom, page: 1, pageSize: 1 });
        return [id, result.total] as const;
      })
    );
    return Object.fromEntries(entries);
  } catch (error) {
    console.error("[article-read-service] getTimeFilterCounts failed:", error);
    return {};
  }
}

/** Splits stored plain-text `articles.content` into paragraph blocks the existing `ArticleContent` component already knows how to render. Falls back to the article's `description` when `content` hasn't been captured for this article, so the page still shows something instead of an empty content area. */
function buildContentBlocks(content: string | null, description: string): ArticleContentBlock[] {
  const source = content && content.trim().length > 0 ? content : description;
  if (!source || source.trim().length === 0) return [];
  return source
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((text) => ({ type: "paragraph" as const, text }));
}

export type ArticleAIInsights = {
  summary: string | null;
  tldr: StoredTldr | null;
  tags: string[];
  sentiment: StoredSentiment | null;
  bias: StoredBias | null;
};

export type ArticleDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  category: string;
  source: string;
  sourceUrl: string;
  publishedDate: string;
  publishedAtIso: string;
  readingTime: string;
  content: ArticleContentBlock[];
  tags: string[];
  trustScore: number;
  trendingScore: number;
  ai: ArticleAIInsights | null;
};

/**
 * Full article detail for `/article/[slug]` - the row itself plus its
 * latest AI enrichment (`article_ai`), never merged together at the
 * database level (see `article-ai-repository.ts`) but combined here
 * into the one shape the page needs. Returns `null` for a missing or
 * deleted article so the page can call `notFound()` instead of
 * crashing.
 */
export async function getArticleDetail(slug: string): Promise<ArticleDetail | null> {
  try {
    const { articles, ai } = await getRepositories();
    const row = await articles.getBySlug(slug);
    if (!row) return null;

    const aiRow = await ai.getLatest(row.id);

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      image: resolveDisplayImage(row),
      category: row.category,
      source: resolveSourceName(row.source_id),
      sourceUrl: row.url,
      publishedDate: formatPublishedDate(row.published_at),
      publishedAtIso: row.published_at,
      readingTime: `${row.reading_time} min read`,
      content: buildContentBlocks(row.content, row.description),
      tags: row.tags,
      trustScore: row.trust_score,
      trendingScore: row.trending_score,
      ai: aiRow
        ? {
            summary: aiRow.summary,
            tldr: aiRow.tldr,
            tags: aiRow.tags,
            sentiment: aiRow.sentiment,
            bias: aiRow.bias,
          }
        : null,
    };
  } catch (error) {
    console.error("[article-read-service] getArticleDetail failed:", error);
    return null;
  }
}

/** Same-category articles (excluding the current one), most-trending first - the real "Similar Articles" list for the article detail page's sidebar. */
export async function getSimilarArticles(category: string, excludeId: string, limit = 4): Promise<CategoryNewsItem[]> {
  try {
    const { articles } = await getRepositories();
    const rows = await articles.getSimilar(category, excludeId, limit);
    return rows.map(toCategoryNewsItem);
  } catch (error) {
    console.error("[article-read-service] getSimilarArticles failed:", error);
    return [];
  }
}

export type SitemapArticleEntry = {
  slug: string;
  updatedAt: string;
};

/** Cap on how many article URLs `sitemap.ts` lists - a bounded, most-recent slice rather than the full table, matching the same "bounded candidate pool" convention `getAllArticlesForExport` (admin-article-service.ts) already uses for CSV export. Large sitemaps beyond this size should move to a sitemap index, which isn't needed at current article volumes. */
const SITEMAP_MAX_ARTICLES = 1000;

/** Most recently published article slugs, for `src/app/sitemap.ts` (Production Readiness phase). Read-only, reuses the existing search() pagination - no new repository method needed. */
export async function getSitemapEntries(): Promise<SitemapArticleEntry[]> {
  try {
    const { articles } = await getRepositories();
    const result = await articles.search({ page: 1, pageSize: SITEMAP_MAX_ARTICLES });
    return result.items.map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
  } catch (error) {
    console.error("[article-read-service] getSitemapEntries failed:", error);
    return [];
  }
}
