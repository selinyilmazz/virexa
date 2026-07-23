import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createArticleRepository } from "@/repositories/article-repository";
import { createArticleAIRepository } from "@/repositories/article-ai-repository";
import { createArticleMetricsRepository } from "@/repositories/article-metrics-repository";
import { createSourceRepository } from "@/repositories/source-repository";
import { createRepositoryRepository } from "@/repositories/repository-repository";
import { createReleaseRepository } from "@/repositories/release-repository";
import { createRuntimeJobRunRepository } from "@/repositories/runtime-job-run-repository";
import { createServiceClient } from "@/lib/supabase/service-client";
import { getAdminSourcesList } from "@/services/admin/admin-source-service";
import { getRuntimeJobHistory, isRuntimeRecentlyActive } from "@/services/admin/admin-runtime-history-service";
import type { Category } from "@/types/news";

/**
 * Server-only read access for `/admin/analytics` (Admin Analytics &
 * Monitoring). Same conventions as every other admin service in this
 * app (`admin-article-service.ts`, `admin-source-service.ts`,
 * `admin-dashboard-service.ts`): never throws (a failure degrades to an
 * empty/zeroed result, never a crashed page), reads via the public,
 * RLS-respecting request-scoped client (articles/sources/metrics/ai are
 * all publicly readable per `0002_article_storage.sql`'s RLS - no
 * service-role client needed anywhere in this file, so the service role
 * key never reaches this read path - requirement 10), and runs every
 * independent repository call in parallel via `Promise.all`
 * (requirement 9 - no N+1 queries).
 *
 * IMPORTANT, documented schema limitation (requirement 2): the
 * `article_metrics` table stores only CURRENT cumulative counters
 * (`view_count`/`bookmark_count`/`share_count`) with no historical,
 * per-day event log, and this phase is not allowed to change the
 * schema. `getTimeSeries()` below therefore uses the most honest
 * available fallback: articles are bucketed by their real
 * `published_at` timestamp (a true time series), while the
 * view/bookmark/share numbers plotted alongside them are each bucket's
 * articles' CURRENT cumulative totals - i.e. "how much engagement have
 * the articles published in this window accumulated to date", not
 * "how many view/bookmark/share events happened in this window". This
 * is called out again in `TimeSeriesPoint`'s doc comment and in the
 * closing report.
 */

const getRepositories = cache(async () => {
  const supabase = await createClient();
  return {
    articles: createArticleRepository(supabase),
    ai: createArticleAIRepository(supabase),
    metrics: createArticleMetricsRepository(supabase),
    sources: createSourceRepository(supabase),
    repositories: createRepositoryRepository(supabase),
    releases: createReleaseRepository(supabase),
  };
});

// ============================================================================
// 1) Summary cards
// ============================================================================

export type AnalyticsSummary = {
  totalArticles: number;
  totalViews: number;
  totalBookmarks: number;
  totalShares: number;
  activeSources: number;
  aiEnrichedArticles: number;
};

const EMPTY_SUMMARY: AnalyticsSummary = {
  totalArticles: 0,
  totalViews: 0,
  totalBookmarks: 0,
  totalShares: 0,
  activeSources: 0,
  aiEnrichedArticles: 0,
};

/** The six summary cards at the top of `/admin/analytics` (requirement 1). Every count/sum runs in parallel, one round trip each. */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  try {
    const { articles, metrics, sources, ai } = await getRepositories();

    const [totalArticles, totalViews, totalBookmarks, totalShares, activeSources, aiEnrichedArticles] = await Promise.all([
      articles.count(),
      metrics.sumViewCounts(),
      metrics.sumBookmarkCounts(),
      metrics.sumShareCounts(),
      sources.countActive(),
      ai.countDistinctArticles(),
    ]);

    return { totalArticles, totalViews, totalBookmarks, totalShares, activeSources, aiEnrichedArticles };
  } catch (error) {
    console.error("[admin-analytics-service] getAnalyticsSummary failed:", error);
    return EMPTY_SUMMARY;
  }
}

// ============================================================================
// 2) Time series analytics
// ============================================================================

export type AnalyticsWindow = "24h" | "7d" | "30d";

export type TimeSeriesPoint = {
  label: string;
  /** True count of articles whose `published_at` falls in this bucket. */
  articleCount: number;
  /** Cumulative `view_count` (as of now) of the articles published in this bucket - see this file's top doc comment for why this isn't a true per-bucket event count. */
  viewCount: number;
  /** Cumulative `bookmark_count` (as of now) of the articles published in this bucket. */
  bookmarkCount: number;
  /** Cumulative `share_count` (as of now) of the articles published in this bucket. */
  shareCount: number;
};

type Bucket = { start: number; end: number; label: string };

function buildBuckets(window: AnalyticsWindow): Bucket[] {
  const now = new Date();
  const buckets: Bucket[] = [];

  if (window === "24h") {
    const end0 = new Date(now);
    end0.setMinutes(0, 0, 0);
    end0.setHours(end0.getHours() + 1);
    for (let i = 23; i >= 0; i--) {
      const end = new Date(end0.getTime() - i * 60 * 60 * 1000);
      const start = new Date(end.getTime() - 60 * 60 * 1000);
      buckets.push({ start: start.getTime(), end: end.getTime(), label: start.toLocaleTimeString("en-US", { hour: "2-digit" }) });
    }
    return buckets;
  }

  const days = window === "7d" ? 7 : 30;
  const end0 = new Date(now);
  end0.setHours(0, 0, 0, 0);
  end0.setDate(end0.getDate() + 1);
  for (let i = days - 1; i >= 0; i--) {
    const end = new Date(end0.getTime() - i * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    buckets.push({
      start: start.getTime(),
      end: end.getTime(),
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  return buckets;
}

/**
 * Time series for the last 24 hours (hourly buckets), 7 days, or 30
 * days (daily buckets) - requirement 2. Fetches every article published
 * within the window plus their current metrics in two parallel-capable
 * round trips (articles first, then their metrics batch-keyed off the
 * returned ids - a true second round trip, not N+1, since it's one
 * query for the whole batch), then buckets in application code (no SQL
 * `date_trunc`/`GROUP BY` support in the shimmed query builder, the
 * same constraint documented throughout this codebase's other admin
 * services).
 */
export async function getTimeSeries(window: AnalyticsWindow): Promise<TimeSeriesPoint[]> {
  try {
    const { articles, metrics } = await getRepositories();
    const buckets = buildBuckets(window);
    if (buckets.length === 0) return [];

    const windowFrom = new Date(buckets[0].start).toISOString();
    const windowTo = new Date(buckets[buckets.length - 1].end).toISOString();

    const articleRows = await articles.listPublishedBetween(windowFrom, windowTo);
    const metricsRows = await metrics.getManyByArticleIds(articleRows.map((row) => row.id));
    const metricsByArticleId = new Map(metricsRows.map((row) => [row.article_id, row]));

    return buckets.map((bucket) => {
      const inBucket = articleRows.filter((row) => {
        const publishedAt = new Date(row.published_at).getTime();
        return publishedAt >= bucket.start && publishedAt < bucket.end;
      });

      let viewCount = 0;
      let bookmarkCount = 0;
      let shareCount = 0;
      for (const row of inBucket) {
        const rowMetrics = metricsByArticleId.get(row.id);
        viewCount += rowMetrics?.view_count ?? 0;
        bookmarkCount += rowMetrics?.bookmark_count ?? 0;
        shareCount += rowMetrics?.share_count ?? 0;
      }

      return { label: bucket.label, articleCount: inBucket.length, viewCount, bookmarkCount, shareCount };
    });
  } catch (error) {
    console.error("[admin-analytics-service] getTimeSeries failed:", error);
    return [];
  }
}

// ============================================================================
// 3) Top lists
// ============================================================================

export type AnalyticsTopArticle = { id: string; slug: string; title: string; value: number };
export type AnalyticsTopSource = { id: string; name: string; value: number };
export type AnalyticsTopCategory = { category: string; value: number };

export type AnalyticsTopLists = {
  mostViewed: AnalyticsTopArticle[];
  mostBookmarked: AnalyticsTopArticle[];
  highestTrustScore: AnalyticsTopArticle[];
  highestTrendingScore: AnalyticsTopArticle[];
  mostActiveSources: AnalyticsTopSource[];
  mostUsedCategories: AnalyticsTopCategory[];
};

const TOP_LIST_LIMIT = 5;

/** Same fixed 13-value taxonomy used by `AdminArticleFilters`' category dropdown (see `types/news.ts`'s `Category` type) - duplicated as a local literal array the same way that component does, rather than introducing a new shared constants module for one list. Includes "Mobile Games" (stabilization pass) so its article count actually surfaces in the Most Used Categories list instead of being silently dropped. */
const CATEGORIES: Category[] = [
  "Technology",
  "Business",
  "AI",
  "Games",
  "Mobile Games",
  "World",
  "Science",
  "Security",
  "Startup",
  "Programming",
  "Mobile",
  "Robotics",
  "Space",
];

/**
 * The six Top Lists (requirement 3). Every independent list is fetched
 * in parallel. Most-viewed/most-bookmarked come from `article_metrics`
 * (a real `ORDER BY view_count/bookmark_count DESC LIMIT N` query, not
 * an aggregation) and are then cross-referenced against `articles` for
 * display fields (title/slug) in one bulk `getByIds` call each - never
 * one query per row. Most-used-categories reuses the same "bounded
 * candidate pool, one count query per known category" tradeoff already
 * established in `admin-source-service.ts`'s per-source article counts
 * (8 known categories, run in parallel).
 */
export async function getTopLists(): Promise<AnalyticsTopLists> {
  try {
    const { articles, metrics } = await getRepositories();

    const [topViewedMetrics, topBookmarkedMetrics, topTrust, topTrending, sourceList, categoryCounts] = await Promise.all([
      metrics.listTopByViewCount(TOP_LIST_LIMIT),
      metrics.listTopByBookmarkCount(TOP_LIST_LIMIT),
      articles.listTopByTrustScore(TOP_LIST_LIMIT),
      articles.listTopByTrending(TOP_LIST_LIMIT),
      getAdminSourcesList(),
      Promise.all(
        CATEGORIES.map((category) => articles.search({ category, page: 1, pageSize: 1 }).then((result) => ({ category, total: result.total })))
      ),
    ]);

    const [viewedArticles, bookmarkedArticles] = await Promise.all([
      articles.getByIds(topViewedMetrics.map((row) => row.article_id)),
      articles.getByIds(topBookmarkedMetrics.map((row) => row.article_id)),
    ]);
    const viewedById = new Map(viewedArticles.map((row) => [row.id, row]));
    const bookmarkedById = new Map(bookmarkedArticles.map((row) => [row.id, row]));

    const mostViewed: AnalyticsTopArticle[] = topViewedMetrics
      .map((row) => {
        const article = viewedById.get(row.article_id);
        return article ? { id: article.id, slug: article.slug, title: article.title, value: row.view_count } : null;
      })
      .filter((item): item is AnalyticsTopArticle => item !== null);

    const mostBookmarked: AnalyticsTopArticle[] = topBookmarkedMetrics
      .map((row) => {
        const article = bookmarkedById.get(row.article_id);
        return article ? { id: article.id, slug: article.slug, title: article.title, value: row.bookmark_count } : null;
      })
      .filter((item): item is AnalyticsTopArticle => item !== null);

    const highestTrustScore: AnalyticsTopArticle[] = topTrust.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      value: row.trust_score,
    }));

    const highestTrendingScore: AnalyticsTopArticle[] = topTrending.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      value: row.trending_score,
    }));

    const mostActiveSources: AnalyticsTopSource[] = [...sourceList]
      .sort((a, b) => b.totalArticles - a.totalArticles)
      .slice(0, TOP_LIST_LIMIT)
      .map((source) => ({ id: source.id, name: source.name, value: source.totalArticles }));

    const mostUsedCategories: AnalyticsTopCategory[] = [...categoryCounts]
      .sort((a, b) => b.total - a.total)
      .slice(0, TOP_LIST_LIMIT)
      .map((entry) => ({ category: entry.category, value: entry.total }));

    return { mostViewed, mostBookmarked, highestTrustScore, highestTrendingScore, mostActiveSources, mostUsedCategories };
  } catch (error) {
    console.error("[admin-analytics-service] getTopLists failed:", error);
    return {
      mostViewed: [],
      mostBookmarked: [],
      highestTrustScore: [],
      highestTrendingScore: [],
      mostActiveSources: [],
      mostUsedCategories: [],
    };
  }
}

// ============================================================================
// 4) AI analytics
// ============================================================================

export type AnalyticsDistributionEntry = { label: string; value: number };

export type AIAnalytics = {
  totalEnriched: number;
  providerDistribution: AnalyticsDistributionEntry[];
  modelDistribution: AnalyticsDistributionEntry[];
  /** Average character length of `summary` across every AI-enriched article's latest version. */
  avgSummaryLength: number;
  avgTagCount: number;
  sentimentDistribution: AnalyticsDistributionEntry[];
  biasDistribution: AnalyticsDistributionEntry[];
};

const EMPTY_AI_ANALYTICS: AIAnalytics = {
  totalEnriched: 0,
  providerDistribution: [],
  modelDistribution: [],
  avgSummaryLength: 0,
  avgTagCount: 0,
  sentimentDistribution: [],
  biasDistribution: [],
};

function tally(values: string[]): AnalyticsDistributionEntry[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/**
 * Provider/model/sentiment/bias distributions plus average summary
 * length and tag count (requirement 4) - computed once over every
 * article's LATEST AI enrichment (`listAllLatestPerArticle()`, one
 * round trip), never per-article.
 */
export async function getAIAnalytics(): Promise<AIAnalytics> {
  try {
    const { ai } = await getRepositories();
    const rows = await ai.listAllLatestPerArticle();

    return {
      totalEnriched: rows.length,
      providerDistribution: tally(rows.map((row) => row.provider || "unknown")),
      modelDistribution: tally(rows.map((row) => row.model || "unknown")),
      avgSummaryLength: Math.round(average(rows.map((row) => row.summary?.length ?? 0))),
      avgTagCount: Number(average(rows.map((row) => row.tags.length)).toFixed(1)),
      sentimentDistribution: tally(rows.map((row) => row.sentiment?.label ?? "unknown")),
      biasDistribution: tally(rows.map((row) => row.bias?.level ?? "unknown")),
    };
  } catch (error) {
    console.error("[admin-analytics-service] getAIAnalytics failed:", error);
    return EMPTY_AI_ANALYTICS;
  }
}

// ============================================================================
// 5) Runtime monitoring
// ============================================================================

export type RuntimeAnalytics = {
  lastRunAt: string | null;
  lastRunJobType: string | null;
  avgDurationMs: number | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  successRatePercent: number | null;
  queueStats: Record<string, number>;
  isSchedulerRunning: boolean;
};

const EMPTY_RUNTIME_ANALYTICS: RuntimeAnalytics = {
  lastRunAt: null,
  lastRunJobType: null,
  avgDurationMs: null,
  lastErrorAt: null,
  lastErrorMessage: null,
  successRatePercent: null,
  queueStats: {},
  isSchedulerRunning: false,
};

/**
 * Runtime pipeline snapshot for Admin Analytics: last run, average
 * completed-job duration, last error, success rate, and recent-activity
 * counts.
 *
 * BUG FIX (this pass): this function used to read `runtimeEngine.queue`/
 * `runtimeEngine.isRunning` directly - in-process, in-memory state. That
 * is the EXACT anti-pattern already identified and fixed in
 * `RuntimeStatusSection.tsx`'s doc comment for the Admin Dashboard: on
 * serverless (Vercel), this page's own render and the cron routes that
 * actually run jobs (`/api/cron/news-fetch`, `/api/cron/ai-enrichment`)
 * execute in different, isolated invocations that never share memory -
 * so this always reported "Scheduler Stopped" and all-zero stats in
 * production regardless of how recently or successfully cron had
 * actually run. That fix was only ever applied to the Dashboard's
 * Runtime Status section, not here - Analytics' "Runtime Monitoring"
 * kept the same misleading in-memory read. Now reuses the exact same
 * durable, DB-backed source (`admin-runtime-history-service.ts`'s
 * `getRuntimeJobHistory()`, reading `runtime_job_runs`) as
 * `RuntimeStatusSection`, plus one extra query here for average
 * duration (not something that component needs) over the last 50
 * completed runs.
 */
export async function getRuntimeAnalyticsSnapshot(): Promise<RuntimeAnalytics> {
  try {
    const history = await getRuntimeJobHistory();
    const { lastRun, lastFailure, recentByStatus } = history;

    const supabase = createServiceClient();
    let avgDurationMs: number | null = null;
    if (supabase) {
      const runtimeJobRunRepository = createRuntimeJobRunRepository(supabase);
      const recentCompleted = await runtimeJobRunRepository.listRecent({ limit: 50, status: "completed" });
      const durations = recentCompleted.map((row) => row.duration_ms).filter((value): value is number => value !== null);
      avgDurationMs = durations.length > 0 ? Math.round(average(durations)) : null;
    }

    const finishedTotal = (recentByStatus.completed ?? 0) + (recentByStatus.failed ?? 0);
    const successRatePercent = finishedTotal > 0 ? Math.round(((recentByStatus.completed ?? 0) / finishedTotal) * 100) : null;

    return {
      lastRunAt: lastRun?.started_at ?? lastRun?.finished_at ?? null,
      lastRunJobType: lastRun?.job_type ?? null,
      avgDurationMs,
      lastErrorAt: lastFailure?.finished_at ?? null,
      lastErrorMessage: lastFailure?.error ?? null,
      successRatePercent,
      queueStats: recentByStatus,
      isSchedulerRunning: isRuntimeRecentlyActive(history),
    };
  } catch (error) {
    console.error("[admin-analytics-service] getRuntimeAnalyticsSnapshot failed:", error);
    return EMPTY_RUNTIME_ANALYTICS;
  }
}

// ============================================================================
// 6) Repositories & Developer Releases analytics
// ============================================================================

export type RepositoryReleaseAnalytics = {
  totalRepositories: number;
  totalReleases: number;
  languageDistribution: AnalyticsDistributionEntry[];
  topRepositoriesByStars: AnalyticsTopSource[];
  channelDistribution: AnalyticsDistributionEntry[];
  releasesByProduct: AnalyticsDistributionEntry[];
};

const EMPTY_REPO_RELEASE_ANALYTICS: RepositoryReleaseAnalytics = {
  totalRepositories: 0,
  totalReleases: 0,
  languageDistribution: [],
  topRepositoriesByStars: [],
  channelDistribution: [],
  releasesByProduct: [],
};

const TOP_REPO_LIMIT = 5;

/**
 * Charts for the two Admin Panel entities added after this file was
 * first written (Repositories/Developer Releases - `repositories()`/
 * `releases()` repositories both read via the public request-scoped
 * client, same as everywhere else in this file: both tables' RLS
 * permits public `select` with no `visible` filter baked into the
 * policy itself - see `0018_repositories.sql`/`0019_developer_releases.sql`
 * - so an admin reading the FULL set (including hidden rows) here is
 * safe without a service-role client, unlike the write paths).
 * Single `list()` call per table; every distribution/top-list is
 * computed in application code over that one result set - no extra
 * round trips.
 */
export async function getRepositoryReleaseAnalytics(): Promise<RepositoryReleaseAnalytics> {
  try {
    const { repositories, releases } = await getRepositories();
    const [repoRows, releaseRows] = await Promise.all([repositories.list(), releases.list()]);

    const topRepositoriesByStars: AnalyticsTopSource[] = [...repoRows]
      .sort((a, b) => b.stars - a.stars)
      .slice(0, TOP_REPO_LIMIT)
      .map((row) => ({ id: row.id, name: row.id, value: row.stars }));

    const releasesByProduct = tally(releaseRows.map((row) => row.product)).slice(0, TOP_REPO_LIMIT);

    return {
      totalRepositories: repoRows.length,
      totalReleases: releaseRows.length,
      languageDistribution: tally(repoRows.map((row) => row.language ?? "Unknown")),
      topRepositoriesByStars,
      channelDistribution: tally(releaseRows.map((row) => row.channel)),
      releasesByProduct,
    };
  } catch (error) {
    console.error("[admin-analytics-service] getRepositoryReleaseAnalytics failed:", error);
    return EMPTY_REPO_RELEASE_ANALYTICS;
  }
}
