import { createServiceClient } from "@/lib/supabase/service-client";
import { searchStockImage } from "@/lib/news";
import { createArticleRepository } from "@/repositories/article-repository";
import { createSourceRepository } from "@/repositories/source-repository";
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
