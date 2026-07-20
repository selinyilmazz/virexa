import { createServiceClient } from "@/lib/supabase/service-client";
import {
  duplicateDetectionStep,
  fetchGNewsStep,
  fetchHnStep,
  fetchNewsApiStep,
  fetchRssStep,
} from "@/runtime/pipeline/steps/fetch-steps";
import { trendingScoreStep } from "@/runtime/pipeline/steps/finalize-steps";
import { runNewsPipeline } from "@/runtime/pipeline/news-pipeline";
import type { DatabaseStepData } from "@/runtime/pipeline/steps/database-step";
import type { JobDefinition } from "@/runtime/types";
import { createArticleRepository } from "@/repositories/article-repository";
import { getLiveArticlesSync } from "@/services/news";

/**
 * News-side jobs. Every job here wraps one or more pipeline steps
 * (`runtime/pipeline/steps/*`) and throws a plain `Error` when the
 * underlying step reports failure - the queue (`RuntimeQueue`) is what
 * turns that into a `RuntimeJobError` and drives retry, so job code
 * itself stays simple.
 */

/**
 * Runs the complete pipeline end to end (RSS -> NewsAPI -> GNews ->
 * Hacker News -> ... -> Cache Refresh, including persistence to the
 * Article Storage tables).
 *
 * Failure semantics (root-cause fix - "Yeni haberler veritabanına
 * gerçekten yazılıyor mu?"): `runNewsPipeline()` never throws - every
 * step, including `database`, catches its own errors and reports
 * `success: false` instead. Previously this job only failed when EVERY
 * step failed, which meant a pipeline that fetched articles fine but
 * silently failed to WRITE them (misconfigured `SUPABASE_SERVICE_ROLE_KEY`
 * in production, an RLS policy rejecting the service role, a schema
 * validation error) still reported `status: "completed"` - the exact
 * "site never updates but nothing looks broken" failure mode this app
 * has actually hit. Two additional checks turn that into a real,
 * visible failure (surfaces in Admin > Runtime's Last Error, the
 * `runtime_job_runs` history, and `/api/cron/news-fetch`'s JSON
 * response) instead of a silently-successful no-op:
 *
 *  1. The `database` step itself reported `success: false`.
 *  2. The `database` step reported `success: true` (e.g. the
 *     "Supabase not configured, no-op" case) but articles WERE fetched
 *     this run and zero of them were saved - a healthy run should never
 *     fetch >0 and persist 0.
 *
 * A partial fetch-provider failure (e.g. GNews down, RSS/NewsAPI/HN
 * fine) is still a successful run, exactly as before - only the
 * database step's outcome gates the news-fetch job's own success now.
 */
export const newsFetchJob: JobDefinition = {
  type: "news-fetch",
  description: "Runs the full news pipeline: fetch, normalize, dedupe, trust score, AI enrichment, trending, database, cache refresh.",
  // Production root-cause fix: this job used to inherit the global
  // 30s default (`runtimeConfig.jobTimeoutMs`) like every other job
  // type, and was timing out and being retried 3x in production
  // (`RuntimeJobError: "news-fetch" timed out after 30000ms`) even
  // after the pipeline fetch steps and image/content resolution were
  // parallelized (see `news-pipeline.ts` and `news-aggregator.ts`) -
  // four independent provider fetches, each with its own bounded
  // image/content extraction, simply don't fit in 30s even at their
  // fastest. 180s stays safely under `vercel.json`'s cron route
  // `maxDuration` (300s) for the one caller that actually matters in
  // production, with real margin for degraded network conditions.
  timeoutMs: 180_000,
  run: async () => {
    const result = await runNewsPipeline();

    if (result.steps.length > 0 && result.steps.every((step) => !step.success)) {
      throw new Error("Every pipeline step failed - see individual step errors in the result.");
    }

    const databaseStep = result.steps.find((step) => step.step === "database");
    if (databaseStep && !databaseStep.success) {
      throw new Error(
        `Database persistence step failed: ${databaseStep.error ?? "unknown error"}. Fetched articles were NOT saved to the database this run.`
      );
    }

    const articlesFetched = result.articles.length;
    const articlesSaved = (databaseStep?.data as DatabaseStepData | undefined)?.articlesSaved ?? 0;
    if (articlesFetched > 0 && articlesSaved === 0) {
      throw new Error(
        `Pipeline fetched ${articlesFetched} article(s) but saved 0 to the database this run. ` +
          `Check that SUPABASE_SERVICE_ROLE_KEY is configured in this environment (Admin > Settings > Environment) and that RLS policies allow the service role to write.`
      );
    }

    return result;
  },
};

export const rssSyncJob: JobDefinition = {
  type: "rss-sync",
  description: "Fetches and normalizes RSS articles only, independent of NewsAPI/GNews/Hacker News.",
  run: async () => {
    const result = await fetchRssStep();
    if (!result.success) throw new Error(result.error ?? "RSS fetch failed");
    return result.data;
  },
};

export const newsApiSyncJob: JobDefinition = {
  type: "newsapi-sync",
  description: "Fetches and normalizes NewsAPI articles only. No-ops safely if NEWS_API_KEY isn't set.",
  run: async () => {
    const result = await fetchNewsApiStep();
    if (!result.success) throw new Error(result.error ?? "NewsAPI fetch failed");
    return result.data;
  },
};

export const gNewsSyncJob: JobDefinition = {
  type: "gnews-sync",
  description: "Fetches and normalizes GNews articles only. No-ops safely if GNEWS_API_KEY isn't set.",
  run: async () => {
    const result = await fetchGNewsStep();
    if (!result.success) throw new Error(result.error ?? "GNews fetch failed");
    return result.data;
  },
};

/** Fetches and normalizes Hacker News (Top/Best/New Stories) articles only, independent of RSS/NewsAPI/GNews. Needs no API key - mirrors `rssSyncJob`'s always-on shape rather than `newsApiSyncJob`/`gNewsSyncJob`'s key-gated one. */
export const hnSyncJob: JobDefinition = {
  type: "hn-sync",
  description: "Fetches and normalizes Hacker News (Top/Best/New Stories) articles only.",
  run: async () => {
    const result = await fetchHnStep();
    if (!result.success) throw new Error(result.error ?? "Hacker News fetch failed");
    return result.data;
  },
};

/** Standalone observability run: re-checks the CURRENT live-articles cache (already deduped by `NewsAggregator` on every fetch) for duplicates. `before === after` confirms nothing slipped through; a mismatch would flag a real bug worth investigating. */
export const duplicateDetectionJob: JobDefinition = {
  type: "duplicate-detection",
  description: "Audits the current live-articles cache for duplicates that shouldn't be there.",
  run: async () => {
    const before = getLiveArticlesSync();
    const result = await duplicateDetectionStep(before);
    if (!result.success) throw new Error(result.error ?? "Duplicate detection failed");
    return { before: before.length, after: result.data?.length ?? 0 };
  },
};

/**
 * Recomputes trending scores for the current live-articles cache and,
 * when the Article Storage layer is configured, persists them via
 * `ArticleRepository.updateTrendingScores` - a lightweight, columns-only
 * write so this job doesn't have to re-validate/re-upsert every other
 * article field. Storage being unconfigured is a normal, safe state
 * (same convention as everywhere else in this app): the job still
 * succeeds and simply reports the scores without persisting them.
 */
export const trendingJob: JobDefinition = {
  type: "trending",
  description: "Recomputes trending scores for the current live-articles cache and persists them if storage is configured.",
  run: async () => {
    const articles = getLiveArticlesSync();
    const result = await trendingScoreStep(articles);
    if (!result.success) throw new Error(result.error ?? "Trending score step failed");

    const scored = result.data ?? [];
    const supabase = createServiceClient();
    let persisted = 0;

    if (supabase && scored.length > 0) {
      const articleRepository = createArticleRepository(supabase);
      await articleRepository.updateTrendingScores(
        scored.map((article) => ({ id: article.id, trendingScore: Math.round(article.trendingScore) }))
      );
      persisted = scored.length;
    }

    return { articleCount: scored.length, persisted, top: scored[0]?.title };
  },
};
