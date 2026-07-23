import { cache } from "react";
import { formatPublishedDate } from "@/lib/news";
import { createClient } from "@/lib/supabase/server";
import { createArticleRepository } from "@/repositories/article-repository";
import { createArticleAIRepository } from "@/repositories/article-ai-repository";
import { createArticleMetricsRepository } from "@/repositories/article-metrics-repository";
import { createSourceRepository } from "@/repositories/source-repository";
import type { ArticleSourceRow, StoredBias, StoredSentiment, StoredTldr } from "@/types/database";

/**
 * Server-only read access for `/admin/articles` - the Admin Foundation
 * counterpart to `services/articles/article-read-service.ts` (public
 * site reads). Same conventions: never throws (a repository failure
 * degrades to an empty page/`null`, never a crashed admin screen -
 * requirement 8), reads via the public, RLS-respecting request-scoped
 * client (articles/sources/metrics/ai are all publicly readable per
 * `0002_article_storage.sql`'s RLS - no service-role client needed for
 * reads, only for the Source Actions write path, see
 * `/api/admin/sources/[id]/route.ts`).
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

export type AdminArticleFilters = {
  sourceId?: string;
  category?: string;
  language?: string;
  country?: string;
  dateFrom?: string;
  dateTo?: string;
  minTrustScore?: number;
  maxTrustScore?: number;
  minTrendingScore?: number;
  maxTrendingScore?: number;
  /** Free-text search across title/url/tags/source name (requirement 3). */
  search?: string;
};

export type AdminArticleAIStatus = "enriched" | "pending";

export type AdminArticleListItem = {
  id: string;
  slug: string;
  title: string;
  sourceName: string;
  category: string;
  language: string;
  publishedDate: string;
  trustScore: number;
  trendingScore: number;
  viewCount: number;
  bookmarkCount: number;
  aiStatus: AdminArticleAIStatus;
  featured: boolean;
  visible: boolean;
};

export type AdminArticlesPage = {
  items: AdminArticleListItem[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

function emptyArticlesPage(page: number, pageSize: number): AdminArticlesPage {
  return { items: [], total: 0, totalPages: 1, page, pageSize };
}

/** Case-insensitive substring match on source name - resolves the admin search box's "Kaynak" target into concrete source ids for `ArticleRepository.search()`'s `searchSourceIds` filter. */
function resolveMatchingSourceIds(sources: ArticleSourceRow[], term: string): string[] {
  const lower = term.toLowerCase();
  return sources.filter((source) => source.name.toLowerCase().includes(lower)).map((source) => source.id);
}

/**
 * Paginated article list for the Admin Articles table (requirement 1).
 * One query for the filtered/paginated article rows, plus two more -
 * run in parallel - to batch-attach metrics and AI status for exactly
 * that page's rows (never one query per row): "Repository sorgularını
 * optimize et."
 */
export async function getAdminArticlesPage(
  filters: AdminArticleFilters,
  page: number,
  pageSize: number
): Promise<AdminArticlesPage> {
  try {
    const { articles, metrics, ai, sources } = await getRepositories();

    const sourceList = await sources.list();
    const sourceNameById = new Map(sourceList.map((source) => [source.id, source.name]));
    const searchSourceIds = filters.search ? resolveMatchingSourceIds(sourceList, filters.search) : [];

    const result = await articles.search({
      sourceId: filters.sourceId,
      category: filters.category,
      language: filters.language,
      country: filters.country,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      minTrustScore: filters.minTrustScore,
      maxTrustScore: filters.maxTrustScore,
      minTrendingScore: filters.minTrendingScore,
      maxTrendingScore: filters.maxTrendingScore,
      searchText: filters.search,
      searchSourceIds: searchSourceIds.length > 0 ? searchSourceIds : undefined,
      sortBy: "published_at",
      page,
      pageSize,
    });

    const articleIds = result.items.map((row) => row.id);
    const [metricsRows, aiByArticleId] = await Promise.all([
      metrics.getManyByArticleIds(articleIds),
      ai.getLatestManyByArticleIds(articleIds),
    ]);
    const metricsByArticleId = new Map(metricsRows.map((row) => [row.article_id, row]));

    const items: AdminArticleListItem[] = result.items.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      sourceName: sourceNameById.get(row.source_id) ?? row.source_id,
      category: row.category,
      language: row.language,
      publishedDate: formatPublishedDate(row.published_at),
      trustScore: row.trust_score,
      trendingScore: row.trending_score,
      viewCount: metricsByArticleId.get(row.id)?.view_count ?? 0,
      bookmarkCount: metricsByArticleId.get(row.id)?.bookmark_count ?? 0,
      aiStatus: aiByArticleId.has(row.id) ? "enriched" : "pending",
      featured: row.featured,
      visible: row.visible,
    }));

    return {
      items,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
      page: result.page,
      pageSize: result.pageSize,
    };
  } catch (error) {
    console.error("[admin-article-service] getAdminArticlesPage failed:", error);
    return emptyArticlesPage(page, pageSize);
  }
}

const EXPORT_PAGE_SIZE = 100;
const MAX_EXPORT_ROWS = 2000;

/**
 * Every article, unfiltered, for the Admin Analytics CSV export
 * (requirement 7) - capped at `MAX_EXPORT_ROWS` as a deliberate safety
 * bound, not a real pagination boundary. Reuses `getAdminArticlesPage`
 * page-by-page (its own internal metrics/AI batching stays intact, so
 * this still never issues one query per article): the first page also
 * reveals the true `totalPages`, so every remaining page is then
 * fetched in parallel via `Promise.all` rather than sequentially -
 * requirement 9's "verileri mümkün olduğunca paralel çek" applied to a
 * multi-page fetch, not just a single page's joins.
 */
export async function getAllArticlesForExport(): Promise<AdminArticleListItem[]> {
  try {
    const first = await getAdminArticlesPage({}, 1, EXPORT_PAGE_SIZE);
    const cappedTotalPages = Math.min(first.totalPages, Math.ceil(MAX_EXPORT_ROWS / EXPORT_PAGE_SIZE));

    if (cappedTotalPages <= 1) {
      return first.items;
    }

    const remainingPages = await Promise.all(
      Array.from({ length: cappedTotalPages - 1 }, (_, index) => getAdminArticlesPage({}, index + 2, EXPORT_PAGE_SIZE))
    );

    return [first, ...remainingPages].flatMap((page) => page.items).slice(0, MAX_EXPORT_ROWS);
  } catch (error) {
    console.error("[admin-article-service] getAllArticlesForExport failed:", error);
    return [];
  }
}

export type AdminArticleDetail = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  content: string;
  description: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
  category: string;
  language: string;
  country: string;
  tags: string[];
  readingTime: number;
  trustScore: number;
  trendingScore: number;
  featured: boolean;
  visible: boolean;
  ai: {
    summary: string | null;
    tldr: StoredTldr | null;
    tags: string[];
    sentiment: StoredSentiment | null;
    bias: StoredBias | null;
  } | null;
  metrics: {
    viewCount: number;
    bookmarkCount: number;
    shareCount: number;
    clickCount: number;
    readingTimeAvg: number;
  } | null;
};

/**
 * Full read-only article detail for the Admin Article Detail Drawer
 * (requirement 4) - the article row, its source, latest AI enrichment,
 * and metrics, fetched in parallel once the article itself is found.
 * Returns `null` for a missing article so the page can render an empty
 * state instead of crashing (requirement 8).
 */
export async function getAdminArticleDetail(id: string): Promise<AdminArticleDetail | null> {
  try {
    const { articles, metrics, ai, sources } = await getRepositories();
    const row = await articles.getById(id);
    if (!row) return null;

    const [source, metricsRow, aiRow] = await Promise.all([
      sources.getById(row.source_id),
      metrics.getByArticleId(row.id),
      ai.getLatest(row.id),
    ]);

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      image: row.image_url,
      content: row.content && row.content.trim().length > 0 ? row.content : row.description,
      description: row.description,
      sourceId: row.source_id,
      sourceName: source?.name ?? row.source_id,
      // Same discussion_url-preferred fix as the public article-read-service
      // - a Hacker News-labeled source link should open Hacker News's own
      // discussion thread, not whatever external site the story links to.
      sourceUrl: row.discussion_url ?? row.url,
      publishedDate: formatPublishedDate(row.published_at),
      category: row.category,
      language: row.language,
      country: row.country,
      tags: row.tags,
      readingTime: row.reading_time,
      trustScore: row.trust_score,
      trendingScore: row.trending_score,
      featured: row.featured,
      visible: row.visible,
      ai: aiRow
        ? { summary: aiRow.summary, tldr: aiRow.tldr, tags: aiRow.tags, sentiment: aiRow.sentiment, bias: aiRow.bias }
        : null,
      metrics: metricsRow
        ? {
            viewCount: metricsRow.view_count,
            bookmarkCount: metricsRow.bookmark_count,
            shareCount: metricsRow.share_count,
            clickCount: metricsRow.click_count,
            readingTimeAvg: metricsRow.reading_time_avg,
          }
        : null,
    };
  } catch (error) {
    console.error("[admin-article-service] getAdminArticleDetail failed:", error);
    return null;
  }
}
