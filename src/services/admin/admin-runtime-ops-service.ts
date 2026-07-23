import { createServiceClient } from "@/lib/supabase/service-client";
import { fetchArticleContent, searchStockImage } from "@/lib/news";
import { inferCategoryFromTitle } from "@/lib/news/category-mapper";
import { createArticleRepository } from "@/repositories/article-repository";
import { createSourceRepository } from "@/repositories/source-repository";
import { runAllAIEnrichmentCapabilities } from "@/services/ai/ai-enrichment-runner";
import type { Category } from "@/types/news";

/**
 * Write-side service for Admin Runtime Operations (requirement 2). Only
 * one operation lives here - "Recalculate Trust Scores" - because it's
 * the one action in that requirement's example list that has no
 * existing `JobType`/queue job counterpart to call into (unlike "Run
 * Pipeline" -> `news-fetch`, "Refresh Cache" -> `cache-refresh`,
 * "Recalculate Trending" -> `trending`, all of which the
 * `/api/admin/runtime/actions` route calls directly via
 * `runtimeEngine.enqueueJob()` - see that route for the rest).
 *
 * UNLIKE every read-only admin service in this app, this function
 * THROWS on failure rather than degrading to a safe empty value - it's
 * a write action invoked from a route handler that needs to tell the
 * admin whether it actually happened, not a page render that must never
 * crash. The route handler is what catches and translates a failure
 * into an HTTP error response.
 *
 * Deliberately NOT a new `JobType`/queue job: the runtime's 13 job types
 * are a fixed, documented set (`runtime/types.ts`), and adding a 14th
 * would mean touching that union plus the job registry plus the
 * scheduler's types - real Runtime architecture surface, which this
 * phase's rules explicitly protect ("Runtime mimarisini bozma"). This
 * is a plain Repository-Pattern read + bulk update instead, exactly the
 * same shape as `TrendingJob`'s own persistence step
 * (`ArticleRepository.updateTrendingScores`), just triggered directly
 * from an admin action instead of from the queue.
 */

export type RecalculateTrustScoresResult = {
  checked: number;
  updated: number;
};

/**
 * Re-syncs every stored article's `trust_score` to match its CURRENT
 * source's `trust_score` in `article_sources` - the real, useful case
 * this covers is an admin updating a source's Trust Score (Source
 * Actions, an earlier phase) and wanting that reflected on every
 * already-ingested article from that source, without re-running the
 * whole news pipeline. Only articles whose score actually differs are
 * written (a plain read + diff + targeted bulk update, not a blind
 * overwrite of every row).
 */
export async function recalculateTrustScores(): Promise<RecalculateTrustScoresResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("Storage is not configured.");
  }

  const articleRepository = createArticleRepository(supabase);
  const sourceRepository = createSourceRepository(supabase);

  const [articles, sources] = await Promise.all([articleRepository.listAllForTrustSync(), sourceRepository.list()]);
  const trustScoreBySourceId = new Map(sources.map((source) => [source.id, source.trust_score]));

  const updates = articles
    .map((article) => ({ id: article.id, currentTrust: article.trust_score, sourceTrust: trustScoreBySourceId.get(article.source_id) }))
    .filter((entry) => entry.sourceTrust !== undefined && entry.sourceTrust !== entry.currentTrust)
    .map((entry) => ({ id: entry.id, trustScore: entry.sourceTrust as number }));

  if (updates.length > 0) {
    await articleRepository.updateTrustScores(updates);
  }

  return { checked: articles.length, updated: updates.length };
}

/** Bounds one "Backfill Real Images" click to a predictable batch size/cost - same order of magnitude as `MAX_STOCK_IMAGE_LOOKUPS_PER_RUN` bounds a single ingestion pipeline run's stock-photo search budget (`services/news/news-aggregator.ts`). An admin can click the action again to work through more of the table. */
const IMAGE_BACKFILL_BATCH_SIZE = 40;

export type BackfillImagesResult = {
  checked: number;
  updated: number;
};

/**
 * Re-runs stage 3 of the image pipeline (`lib/news/stock-image-provider.ts`
 * - Pexels/Unsplash/Pixabay/Wikimedia Commons) for already-stored
 * articles that are still sitting on the local category placeholder
 * (`image_source` is null or `'placeholder'`) - the retroactive
 * counterpart to the pipeline's own stage 3, which only ever runs for
 * NEWLY-ingested articles going forward. Without this, articles stored
 * before that pipeline stage existed (or whose ingestion-time search
 * simply found nothing) would keep their placeholder forever, since
 * nothing else in the app ever re-visits an already-persisted row's
 * image.
 *
 * Same shape as `recalculateTrustScores` above: a plain Repository-
 * Pattern read + bulk update triggered directly from an admin action,
 * not a new `JobType`/queue job. Only articles a stock search actually
 * found a real photo for are written - one still stuck on the
 * placeholder after this (every provider unconfigured/unreachable, or a
 * genuinely obscure title with no good match anywhere) is left
 * unchanged rather than being counted as "updated", so re-running the
 * action doesn't misreport no-op rows as progress.
 */
export async function backfillArticleImages(): Promise<BackfillImagesResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("Storage is not configured.");
  }

  const articleRepository = createArticleRepository(supabase);
  const candidates = await articleRepository.listNeedingImageBackfill(IMAGE_BACKFILL_BATCH_SIZE);
  if (candidates.length === 0) {
    return { checked: 0, updated: 0 };
  }

  const results = await Promise.allSettled(
    candidates.map((candidate) => searchStockImage(candidate.title, candidate.category as Category))
  );

  const updates: { id: string; imageUrl: string; imageSource: string }[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      updates.push({
        id: candidates[index].id,
        imageUrl: result.value.url,
        imageSource: `stock:${result.value.provider}`,
      });
    } else if (result.status === "rejected") {
      console.error(`[admin-runtime-ops-service] Image backfill search failed for "${candidates[index].title}":`, result.reason);
    }
  });

  if (updates.length > 0) {
    await articleRepository.updateImages(updates);
  }

  return { checked: candidates.length, updated: updates.length };
}

/** Matches `news-aggregator.ts`'s `MAX_CONTENT_EXTRACTIONS_PER_RUN` (product polishing phase, 4th pass, item 9 - "her makale için tam içerik çıkarılsın") so an admin-triggered backfill can catch up already-persisted thin articles at the same rate new ones get extracted at ingestion time. */
const CONTENT_BACKFILL_BATCH_SIZE = 60;

export type BackfillContentResult = {
  checked: number;
  updated: number;
};

/**
 * Re-runs the content-extraction stage (`lib/news/article-content.ts`)
 * for already-stored articles whose `content` is still missing or too
 * thin to read - the retroactive counterpart to
 * `news-aggregator.ts`'s content-resolution stage, which only ever runs
 * for NEWLY-ingested articles going forward. Product polishing phase,
 * 2nd pass, area 8: without this, articles stored before that pipeline
 * stage existed would keep their thin RSS blurb forever.
 *
 * Same shape as `backfillArticleImages` above: a plain Repository-
 * Pattern read + bulk update triggered directly from an admin action.
 * Only articles the extractor actually found substantial real text for
 * are written - one still thin after this (paywall, non-HTML response,
 * robots-blocked, genuinely short source article) is left unchanged
 * rather than counted as "updated", and still falls back to
 * `buildContentBlocks()`'s description+AI-summary combination on the
 * article page regardless.
 */
export async function backfillArticleContent(): Promise<BackfillContentResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("Storage is not configured.");
  }

  const articleRepository = createArticleRepository(supabase);
  const candidates = await articleRepository.listNeedingContentBackfill(CONTENT_BACKFILL_BATCH_SIZE);
  if (candidates.length === 0) {
    return { checked: 0, updated: 0 };
  }

  const results = await Promise.allSettled(candidates.map((candidate) => fetchArticleContent(candidate.url)));

  const updates: { id: string; content: string }[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      updates.push({ id: candidates[index].id, content: result.value });
    } else if (result.status === "rejected") {
      console.error(`[admin-runtime-ops-service] Content backfill extraction failed for "${candidates[index].url}":`, result.reason);
    }
  });

  if (updates.length > 0) {
    await articleRepository.updateContent(updates);
  }

  return { checked: candidates.length, updated: updates.length };
}

export type BackfillCategoriesResult = {
  checked: number;
  updated: number;
  /** Per-category breakdown of how many articles were MOVED INTO each category by this run - lets the admin see e.g. `{ "Mobile Games": 14, "Games": 6 }` confirming the new keyword classifier actually found real matches, not just a bare "12 updated" count. */
  byCategory: Record<string, number>;
};

/**
 * Stabilization pass, item 1: "Run a complete backfill using the new
 * classifier so existing articles are automatically recategorized...
 * without waiting for future imports." `inferCategoryFromTitle()`
 * (`lib/news/category-mapper.ts`) is only ever applied to articles as
 * they're ingested (`NewsAggregator.normalizeProviderItem`) - adding a
 * new keyword there (e.g. "Mobile Games"'s "android games"/"unity
 * mobile"/etc.) has zero effect on the thousands of rows already sitting
 * in the `articles` table with whatever category they were assigned at
 * ingestion time under the OLD, narrower keyword list. This is the
 * retroactive counterpart: re-runs the exact same classifier against
 * every stored article's title and overwrites `category` wherever the
 * classifier's answer differs from what's currently stored.
 *
 * Deliberately unbounded (unlike `backfillArticleImages`/
 * `backfillArticleContent`'s capped batches) - see
 * `listAllForCategoryBackfill`'s doc comment: this is pure, local,
 * synchronous JS (a handful of regex tests per title), not a network/AI
 * call, so there's no per-row cost to budget against and no reason to
 * make an admin click through the whole table in batches.
 *
 * Only a title that actually matches one of `inferCategoryFromTitle`'s
 * keyword patterns is touched. A title matching nothing keeps its
 * current category untouched (same "only narrows, never invents"
 * contract `inferCategoryFromTitle` already documents) - this run can
 * only make the category distribution MORE accurate, never blanket-reset
 * everything to a fallback.
 */
export async function backfillArticleCategories(): Promise<BackfillCategoriesResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("Storage is not configured.");
  }

  const articleRepository = createArticleRepository(supabase);
  const articles = await articleRepository.listAllForCategoryBackfill();

  const byCategory: Record<string, number> = {};
  const updates: { id: string; category: string }[] = [];
  // TEMPORARY diagnostic logging (Mobile Games 0-articles investigation) -
  // shows, per article, exactly what the classifier decided and whether
  // that decision resulted in a write. Safe to remove once the root cause
  // is confirmed against real production log output - not gated behind a
  // debug flag since this only runs when an admin explicitly clicks
  // "Backfill Categories," not on any hot/user-facing path.
  let gamesMatches = 0;
  let mobileGamesMatches = 0;
  for (const article of articles) {
    const inferred = inferCategoryFromTitle(article.title);
    const willUpdate = Boolean(inferred && inferred !== article.category);
    if (inferred === "Games") gamesMatches += 1;
    if (inferred === "Mobile Games") mobileGamesMatches += 1;
    console.log("[backfillArticleCategories]", {
      title: article.title,
      oldCategory: article.category,
      detectedCategory: inferred ?? "(no keyword match)",
      updateExecuted: willUpdate,
    });
    if (willUpdate && inferred) {
      updates.push({ id: article.id, category: inferred });
      byCategory[inferred] = (byCategory[inferred] ?? 0) + 1;
    }
  }
  console.log("[backfillArticleCategories] SUMMARY", {
    totalArticlesScanned: articles.length,
    titlesMatchingGamesKeywords: gamesMatches,
    titlesMatchingMobileGamesKeywords: mobileGamesMatches,
    totalUpdatesQueued: updates.length,
  });

  if (updates.length > 0) {
    await articleRepository.updateCategories(updates);
    console.log("[backfillArticleCategories] updateCategories() called with", updates.length, "row(s)");
  } else {
    console.log("[backfillArticleCategories] no updates to write - updateCategories() was NOT called");
  }

  return { checked: articles.length, updated: updates.length, byCategory };
}

export type BackfillAIEnrichmentResult = {
  checked: number;
  updated: number;
  /** Per-capability breakdown, e.g. `{ summary: 12, tags: 8, ... }` - lets the Admin Dashboard show which capabilities actually had a backlog. */
  byCapability: Record<string, number>;
};

/**
 * Retroactively runs EVERY AI capability (Summary, TL;DR, Key Takeaways,
 * Long Summary, Rewrite, Entities, Tags, Sentiment, Bias) for
 * already-stored articles that never got each one - the retroactive
 * counterpart to the 9 independent AI jobs
 * (`runtime/jobs/ai-jobs.ts`)/cron route (`/api/cron/ai-enrichment`),
 * which only ever touch articles a scheduled run's own bounded batch
 * reaches going forward.
 *
 * Production architecture fix (goal 7 - "Runtime Dashboard'daki 'Backfill
 * AI Enrichment' ve cron aynı yeni mimariyi kullansın; kod tekrarı
 * olmasın"): this used to have its OWN copy of the candidate-selection/
 * generate/carry-forward/upsert logic, scoped to just Summary + Key
 * Takeaways. It now calls the exact same `runAllAIEnrichmentCapabilities()`
 * (`services/ai/ai-enrichment-runner.ts`) the cron route and every
 * individual AI job call - one implementation, and this button now
 * covers all 9 capabilities instead of 2. Each capability runs its own
 * bounded batch with controlled concurrency, independently of the
 * others (one capability's DB/provider issue never blocks the rest -
 * see that module's doc comment for the full picture).
 */
export async function backfillArticleAIEnrichment(): Promise<BackfillAIEnrichmentResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("Storage is not configured.");
  }

  const results = await runAllAIEnrichmentCapabilities();

  const byCapability: Record<string, number> = {};
  let checked = 0;
  let updated = 0;
  for (const result of results) {
    byCapability[result.capability] = result.updated;
    checked = Math.max(checked, result.checked);
    updated += result.updated;
  }

  return { checked, updated, byCapability };
}
