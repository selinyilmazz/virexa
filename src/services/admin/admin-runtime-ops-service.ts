import { createServiceClient } from "@/lib/supabase/service-client";
import { createArticleRepository } from "@/repositories/article-repository";
import { createSourceRepository } from "@/repositories/source-repository";

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
