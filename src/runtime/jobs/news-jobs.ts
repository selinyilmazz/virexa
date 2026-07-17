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

/** Runs the complete pipeline end to end (RSS -> NewsAPI -> GNews -> Hacker News -> ... -> Cache Refresh, including persistence to the Article Storage tables). Only fails the job outright if every single step failed - a partial failure (e.g. GNews down, everything else fine) is still a successful run, already logged step-by-step. */
export const newsFetchJob: JobDefinition = {
  type: "news-fetch",
  description: "Runs the full news pipeline: fetch, normalize, dedupe, trust score, AI enrichment, trending, database, cache refresh.",
  run: async () => {
    const result = await runNewsPipeline();
    if (result.steps.length > 0 && result.steps.every((step) => !step.success)) {
      throw new Error("Every pipeline step failed - see individual step errors in the result.");
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
