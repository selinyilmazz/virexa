import { cache } from "react";
import { categories as categoryTaxonomy } from "@/data/categories";
import type { CategoryNewsItem } from "@/data/categories";
import type { ArticleContentBlock } from "@/data/article";
import {
  estimateReadingTime,
  formatPublishedDate,
  getSourceById,
  MIN_ACCEPTABLE_CONTENT_LENGTH,
  resolveArticleImage,
  searchStockImage,
  SEARCH_CATEGORY_SLUGS,
} from "@/lib/news";
import { createClient } from "@/lib/supabase/server";
import { createArticleAIRepository } from "@/repositories/article-ai-repository";
import { createArticleMetricsRepository } from "@/repositories/article-metrics-repository";
import { createArticleRepository } from "@/repositories/article-repository";
import { createSourceRepository } from "@/repositories/source-repository";
import type { FullTextSearchParams } from "@/lib/validation/article-storage-schema";
import type { ArticleRow, StoredBias, StoredLongSummary, StoredSentiment, StoredTldr } from "@/types/database";
import type { Category as NewsCategory } from "@/types/news";

/** Category name -> emoji icon, reusing `src/data/categories.ts`'s existing taxonomy (already has one per category for the `/category/[slug]` pages) instead of maintaining a second copy just for the homepage's Trending Topics widget. */
const CATEGORY_ICON_BY_NAME = new Map(categoryTaxonomy.map((category) => [category.name, category.icon]));

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

/** Bounds the Hero's on-demand stock-photo lookup below (product polishing phase, area 1) so a slow/unresponsive provider chain can never hold up the whole homepage render - the Hero still renders with its existing (placeholder) image on timeout, same as if the search had simply found nothing. */
const HERO_IMAGE_SEARCH_TIMEOUT_MS = 6000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([promise, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))]);
}

/**
 * The single highest-`trending_score` article, flagged with whether it
 * already has AI enrichment (`article_ai`) - backs Home's Hero/"Featured"
 * section. `hasAIInsights` is what lets the Hero honestly badge itself
 * "AI Recommended" instead of just "Trending" when true, folding the
 * "Featured" and "AI Recommended" homepage requirements into the one
 * existing hero slot rather than adding a new section.
 *
 * Product polishing phase, area 1 ("never intentionally display the
 * generic SVG for the Hero"): the ingestion-time and admin-backfill
 * image pipelines only ever touch NEWLY-fetched or explicitly-backfilled
 * rows, so it's possible for the CURRENT top-trending article to still
 * be sitting on its local category placeholder. Since the Hero is the
 * one slot on the whole site where that's most visible, this is the one
 * place read-time falls through to a live `searchStockImage` call (by
 * title/keywords, same stage-3 provider chain ingestion itself uses)
 * before ever accepting the local SVG - bounded by
 * `HERO_IMAGE_SEARCH_TIMEOUT_MS` so a slow provider can't stall the
 * homepage, and persisted back via `updateImages` (fire-and-forget) so
 * this lookup only ever happens once per article, not once per request.
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

    let image = resolveDisplayImage(top);
    const stillOnPlaceholder = !top.image_source || top.image_source === "placeholder";
    if (stillOnPlaceholder) {
      const category = VALID_CATEGORIES.has(top.category as NewsCategory) ? (top.category as NewsCategory) : "Technology";
      const stockResult = await withTimeout(searchStockImage(top.title, category), HERO_IMAGE_SEARCH_TIMEOUT_MS);
      if (stockResult) {
        image = stockResult.url;
        articles.updateImages([{ id: top.id, imageUrl: stockResult.url, imageSource: `stock:${stockResult.provider}` }]).catch((error) => {
          console.error("[article-read-service] getFeaturedArticle: failed to persist hero stock image:", error);
        });
      }
    }

    return { ...toCategoryNewsItem(top), image, hasAIInsights: insight !== null };
  } catch (error) {
    console.error("[article-read-service] getFeaturedArticle failed:", error);
    return null;
  }
});

/**
 * Exact, paginated "most read" listing for the dedicated `/most-read`
 * page - sorted by `trending_score` via `ArticleRepository.search()`'s
 * `sortBy` option, using the same `count: "exact"` pagination as every
 * other real listing (category, search). The homepage no longer has its
 * own "Most Read" widget (product polishing phase, 2nd pass:
 * "sadeleştir" - it was dropped along with the sidebar layout), so this
 * dedicated page is the only remaining consumer of most-read data.
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

export type TrendingCategoryStat = {
  rank: number;
  name: string;
  articleCount: string;
  /** Emoji icon for this category, from `src/data/categories.ts`'s taxonomy - falls back to a generic newspaper icon for any category that somehow isn't in that list. */
  icon: string;
  /** Total stored articles in this category (the number `articleCount` is formatted from). */
  count: number;
  /** This-week-vs-last-week direction, computed from `sparkline`'s underlying 14-day window - see `buildCategoryTrendStats`. `"new"` means last week had zero articles but this week has at least one (a fresh/reactivated category, not yet meaningfully comparable as a percentage). */
  trendDirection: "up" | "down" | "flat" | "new";
  /** Absolute percent change, this week vs last week - 0 for "flat"/"new". */
  trendPercent: number;
  /** Daily article counts for the last 7 days, oldest to newest - the data behind the widget's mini sparkline. */
  sparkline: number[];
  /** The single newest article in this category, for the widget's inline preview - `null` only if the category somehow has a count but no rows returned (shouldn't happen, defensive). */
  latestArticle: { slug: string; title: string; image: string } | null;
};

/**
 * Buckets a pool of already-fetched rows into one category's last-14-days
 * daily counts, then derives the 7-day sparkline and a this-week-vs-
 * last-week trend direction/percent from it. Pure in-memory computation -
 * no extra query per category - the caller (`getTrendingCategories`)
 * fetches the whole 14-day window ONCE across every category and calls
 * this once per category against that same shared pool, the same
 * "caller buckets rows in application code" convention
 * `listPublishedBetween`'s own doc comment establishes for Admin
 * Analytics' Time Series chart.
 */
function buildCategoryTrendStats(
  fourteenDayPool: ArticleRow[],
  categoryName: string
): Pick<TrendingCategoryStat, "sparkline" | "trendDirection" | "trendPercent"> {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const dailyCounts = new Array(14).fill(0) as number[]; // index 0 = 13 days ago ... index 13 = today

  for (const row of fourteenDayPool) {
    if (row.category !== categoryName) continue;
    const ageMs = now - new Date(row.published_at).getTime();
    const dayIndex = 13 - Math.floor(ageMs / DAY_MS);
    if (dayIndex >= 0 && dayIndex < 14) dailyCounts[dayIndex] += 1;
  }

  const sparkline = dailyCounts.slice(7, 14);
  const thisWeek = sparkline.reduce((sum, value) => sum + value, 0);
  const lastWeek = dailyCounts.slice(0, 7).reduce((sum, value) => sum + value, 0);

  if (lastWeek === 0) {
    return { sparkline, trendDirection: thisWeek > 0 ? "new" : "flat", trendPercent: 0 };
  }

  const diff = thisWeek - lastWeek;
  return {
    sparkline,
    trendDirection: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
    trendPercent: Math.abs(Math.round((diff / lastWeek) * 100)),
  };
}

/**
 * Real per-category stats across all 12 canonical categories
 * (`SEARCH_CATEGORY_SLUGS`), sorted by article count descending - backs
 * the redesigned "Trending Topics" widget (Home) with the site's actual
 * category distribution, trend direction, a 7-day sparkline, and each
 * category's newest article, instead of a static topic list or a bare
 * rank+count row.
 *
 * Previously this tallied category frequency across only the top-100
 * highest-`trending_score` articles (`listTopByTrending(100)`). That
 * was a fragile proxy: a brand-new article starts with a low
 * `trending_score` regardless of category, so any category whose
 * articles hadn't yet accumulated enough score to crack that
 * fixed-size-100 pool was invisible to this widget - even once real
 * articles existed for it. Fixed by running one small, count-only query
 * per category in parallel (same pattern `getCategoryFilterCounts`
 * already uses for the search sidebar's filter counts) instead of
 * sampling a trending-score-ordered pool - every category with at least
 * one stored article is counted correctly. That query already returns
 * each category's newest article too (`search()` defaults to
 * newest-first), so no separate "latest article" round trip is needed.
 *
 * The sparkline/trend numbers come from one ADDITIONAL query - a single
 * 14-day window across every category at once (`listPublishedBetween`,
 * capped at 3000 rows) - rather than a second per-category query each,
 * bucketed in application code by `buildCategoryTrendStats`.
 */
export async function getTrendingCategories(limit = 6): Promise<TrendingCategoryStat[]> {
  try {
    const { articles } = await getRepositories();

    const perCategory = await Promise.all(
      SEARCH_CATEGORY_SLUGS.map(async ({ name }) => {
        const result = await articles.search({ category: name, page: 1, pageSize: 1 });
        return { name, count: result.total, latest: result.items[0] ?? null };
      })
    );

    const active = perCategory
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    if (active.length === 0) return [];

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDayPool = await articles.listPublishedBetween(fourteenDaysAgo, new Date().toISOString(), 3000);

    return active.map((entry, index) => ({
      rank: index + 1,
      name: entry.name,
      articleCount: `${entry.count} article${entry.count === 1 ? "" : "s"}`,
      icon: CATEGORY_ICON_BY_NAME.get(entry.name) ?? "📰",
      count: entry.count,
      ...buildCategoryTrendStats(fourteenDayPool, entry.name),
      latestArticle: entry.latest
        ? { slug: entry.latest.slug, title: entry.latest.title, image: resolveDisplayImage(entry.latest) }
        : null,
    }));
  } catch (error) {
    console.error("[article-read-service] getTrendingCategories failed:", error);
    return [];
  }
}

export type TopSourceStat = {
  name: string;
  count: number;
};

/**
 * Which sources publish the most in this category, ranked by article
 * count - backs the category sidebar's "Top Sources" widget (product
 * polishing phase, area 7: the "Popular Tags" widget it replaces was a
 * static list of non-clickable pills built straight from the taxonomy
 * data, with no real discovery value). Counts across a bounded recent
 * pool of the category's own articles (not a second full-table scan) so
 * it reflects which sources are actively covering this category, and
 * doubles as real navigation - the UI links each source through to a
 * source-filtered search.
 */
export async function getTopSourcesForCategory(categoryName: string, limit = 5): Promise<TopSourceStat[]> {
  try {
    const { articles } = await getRepositories();
    const result = await articles.search({ category: categoryName, page: 1, pageSize: 300 });

    const counts = new Map<string, number>();
    for (const row of result.items) {
      const name = resolveSourceName(row.source_id);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error("[article-read-service] getTopSourcesForCategory failed:", error);
    return [];
  }
}

export type BreakingNewsArticle = CategoryNewsItem & { isFresh: boolean };

/**
 * High-trending articles published within the last 48 hours - backs the
 * "Breaking News" section. Falls back to the top-trending pool
 * regardless of age when fewer than `limit` articles are actually fresh
 * (a young or slow-moving dataset shouldn't render an empty "Breaking
 * News" section) - `isFresh` tells the UI which is which, so a
 * genuinely-recent story can still get a distinct "just in" treatment
 * even when the section as a whole had to backfill with older items.
 */
export async function getBreakingNews(limit = 4, excludeSlugs: string[] = []): Promise<BreakingNewsArticle[]> {
  try {
    const { articles } = await getRepositories();
    const pool = await articles.listTopByTrending(Math.max(limit * 5, 30) + excludeSlugs.length);
    const filtered = pool.filter((row) => !excludeSlugs.includes(row.slug));

    const freshCutoff = Date.now() - 48 * 60 * 60 * 1000;
    const fresh = filtered.filter((row) => new Date(row.published_at).getTime() >= freshCutoff);
    const chosen = (fresh.length >= limit ? fresh : filtered).slice(0, limit);
    const freshIds = new Set(fresh.map((row) => row.id));

    return chosen.map((row) => ({ ...toCategoryNewsItem(row), isFresh: freshIds.has(row.id) }));
  } catch (error) {
    console.error("[article-read-service] getBreakingNews failed:", error);
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

/**
 * Splits stored plain-text `articles.content` into paragraph blocks the
 * existing `ArticleContent` component already knows how to render. When
 * `content` is missing or too thin to read (below the same
 * `MIN_ACCEPTABLE_CONTENT_LENGTH` bar the ingestion-time
 * `fetchArticleContent` extractor already enforces for newly-fetched
 * articles - see `news-aggregator.ts`'s content-resolution stage), falls
 * back to a richer combination of `description` + the article's already
 * -existing AI enrichment (`summary`/`tldr`, from `article_ai` - never a
 * NEW AI call made here) instead of showing the bare, often single-
 * sentence `description` alone. This only matters for articles ingested
 * before that extraction stage existed, or where extraction itself
 * failed for that specific article's page (paywall, non-HTML response,
 * etc.) - product polishing phase, 2nd pass, area 8: "çok kısa
 * içerikler gösterme."
 */
function buildContentBlocks(
  content: string | null,
  description: string,
  aiSummary: string | null,
  tldr: StoredTldr | null
): ArticleContentBlock[] {
  const trimmedContent = content?.trim() ?? "";
  if (trimmedContent.length >= MIN_ACCEPTABLE_CONTENT_LENGTH) {
    return trimmedContent
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0)
      .map((text) => ({ type: "paragraph" as const, text }));
  }

  const blocks: ArticleContentBlock[] = [];
  const trimmedDescription = description?.trim() ?? "";
  if (trimmedDescription.length > 0) {
    blocks.push({ type: "paragraph", text: trimmedDescription });
  }

  const trimmedSummary = aiSummary?.trim() ?? "";
  if (trimmedSummary.length > 0 && trimmedSummary !== trimmedDescription) {
    blocks.push({ type: "paragraph", text: trimmedSummary });
  }

  const bulletText = (tldr?.bullets ?? []).map((bullet) => bullet.trim()).filter((bullet) => bullet.length > 0).join(" ");
  if (bulletText.length > 0) {
    blocks.push({ type: "paragraph", text: bulletText });
  }

  // Whatever short raw `content` did exist (below the length bar above,
  // but not necessarily empty) is still real article text, worth
  // showing after the richer summary blocks rather than discarding it.
  if (trimmedContent.length > 0 && trimmedContent !== trimmedDescription) {
    blocks.push({ type: "paragraph", text: trimmedContent });
  }

  return blocks;
}

/** Flattens `ArticleContentBlock[]` back to plain text - used only to feed `estimateReadingTime` on whatever content actually ends up on the page (see `getArticleDetail` below), so "Reading Time" reflects the real, final rendered length rather than a value computed once at ingestion time and never revisited. */
function blocksToPlainText(blocks: ArticleContentBlock[]): string {
  return blocks
    .map((block) => (block.type === "list" ? block.items.join(" ") : block.text))
    .join(" ")
    .trim();
}

export type ArticleAIInsights = {
  summary: string | null;
  tldr: StoredTldr | null;
  tags: string[];
  sentiment: StoredSentiment | null;
  bias: StoredBias | null;
};

/**
 * The article detail page's Priority-2 content fallback (product
 * polishing phase, 3rd pass, item 5) - only ever set when the article's
 * real content is still too thin after ingestion-time extraction AND an
 * AI-generated `long_summary` exists for it (`ai-steps.ts`'s
 * `longSummaryStep` only runs for exactly those articles). `null` means
 * the page should keep showing `content` (the real/description-based
 * blocks) as-is instead.
 */
export type StructuredSummary = StoredLongSummary;

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
  /** Set only when `content` is still thin and an AI long summary is available for this article - see `StructuredSummary`'s doc comment. */
  structuredSummary: StructuredSummary | null;
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
    const content = buildContentBlocks(row.content, row.description, aiRow?.summary ?? null, aiRow?.tldr ?? null);

    // Product polishing phase, 3rd pass: "İçerik uzunluğuna göre otomatik
    // hesapla" - recomputed here from the FINAL resolved content (real
    // extracted body, or the description+AI-summary fallback above)
    // rather than trusting `row.reading_time`, which was only ever
    // stamped once at ingestion time from whatever thin content the
    // provider originally supplied and never revisited afterwards.
    const resolvedContentText = blocksToPlainText(content);

    // Priority-2 fallback (product polishing phase, 3rd pass, item 5):
    // only offered when the article's raw `content` is still thin - a
    // full/real body always wins, the structured summary never replaces
    // actual article text, only ever stands in for it.
    const isRawContentThin = (row.content?.trim().length ?? 0) < MIN_ACCEPTABLE_CONTENT_LENGTH;
    const structuredSummary = isRawContentThin && aiRow?.long_summary ? aiRow.long_summary : null;

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      image: resolveDisplayImage(row),
      category: row.category,
      source: resolveSourceName(row.source_id),
      // Prefer the article's own discussion page (currently only ever
      // set for Hacker News - see `types/database.ts`'s `discussion_url`
      // doc comment) over its plain `url`, so a link labeled with the
      // source's name always opens THAT source, not whatever external
      // site (e.g. a Reddit thread) the story happens to link to. Every
      // non-Hacker-News article has `discussion_url === null` and
      // this falls back to `url` exactly as before - zero behavior
      // change for RSS/NewsAPI/GNews-sourced articles.
      sourceUrl: row.discussion_url ?? row.url,
      publishedDate: formatPublishedDate(row.published_at),
      publishedAtIso: row.published_at,
      readingTime: `${estimateReadingTime(resolvedContentText, row.description)} min read`,
      content,
      structuredSummary,
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
