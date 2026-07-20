import { hashArticleContent } from "@/lib/ai/content-hash";
import { createServiceClient } from "@/lib/supabase/service-client";
import { fetchArticleContent, searchStockImage } from "@/lib/news";
import type { ArticleAIInput } from "@/lib/validation/article-storage-schema";
import { createArticleAIRepository } from "@/repositories/article-ai-repository";
import { createArticleRepository } from "@/repositories/article-repository";
import { createSourceRepository } from "@/repositories/source-repository";
import { aiService } from "@/services/ai";
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

/** Matches the pipeline's own broad-tier per-run cap (`MAX_BROAD_AI_ARTICLES_PER_RUN` in `runtime/pipeline/steps/ai-steps.ts`) - an admin-triggered backfill batch shouldn't cost more per click than a single live pipeline run already spends on Summary + Key Takeaways. */
const AI_ENRICHMENT_BACKFILL_BATCH_SIZE = 60;

export type BackfillAIEnrichmentResult = {
  checked: number;
  updated: number;
};

/**
 * Retroactively runs the pipeline's broad-tier AI capabilities (Summary +
 * Key Takeaways, `runtime/pipeline/steps/ai-steps.ts`'s `aiSummaryStep`/
 * `keyTakeawaysStep`) for already-stored articles that never got either
 * one - the retroactive counterpart to that broad tier, which only ever
 * runs for articles a live pipeline run's own `MAX_BROAD_AI_ARTICLES_PER_RUN`
 * window touches going forward. Product polishing phase, 5th pass:
 * "mevcut veritabanındaki eski haberler için de toplu (backfill) AI
 * enrichment işlemi ekle; böylece eski makaleler de kısa içerikle
 * kalmasın" - without this, articles ingested before Key Takeaways (or
 * even Summary) existed, or ones that simply fell outside a run's cap at
 * the time, would keep thin/missing AI insights forever.
 *
 * Same shape as `backfillArticleContent`/`backfillArticleImages` above: a
 * plain Repository-Pattern read + bulk write triggered directly from an
 * admin action, ordered by `trending_score` so the backfill prioritizes
 * the articles readers are most likely to actually open. Scans a wider
 * trending-score window than the batch size and filters in application
 * code for articles missing a `summary` or `key_takeaways` (no
 * `article_ai` row at all, or a row that predates one of those two
 * fields), same "scan wide, cap the result" tradeoff as
 * `listNeedingContentBackfill`.
 *
 * Deliberately does NOT touch `rewritten_article` here - this backfill
 * is scoped to Summary + Key Takeaways only (the two fields this
 * function name promises); an old article getting the full rewrite too
 * is a separate concern, even though `articleRewriteStep` now runs on
 * the same broad tier as Summary/Key Takeaways for newly-processed
 * articles going forward (see `ai-steps.ts`).
 *
 * Carries forward any AI fields THIS backfill doesn't touch (tldr,
 * long_summary, rewritten_article, entities, tags, sentiment, bias) from
 * the article's existing latest `article_ai` row when that row's
 * `cache_key` still matches the article's current content - otherwise
 * the upsert (keyed on `article_id, provider, cache_key`) would silently
 * overwrite and lose that earlier work whenever the same version row is
 * hit again. If the content has since changed, nothing is carried
 * forward (a stale version's fields don't belong on a new one) and a
 * fresh row is written with just Summary + Key Takeaways, exactly like
 * the pipeline's own database step would.
 */
export async function backfillArticleAIEnrichment(): Promise<BackfillAIEnrichmentResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("Storage is not configured.");
  }

  const articleRepository = createArticleRepository(supabase);
  const aiRepository = createArticleAIRepository(supabase);

  const SCAN_WINDOW = Math.max(AI_ENRICHMENT_BACKFILL_BATCH_SIZE * 5, 300);
  const candidates = await articleRepository.listTopByTrending(SCAN_WINDOW);
  if (candidates.length === 0) {
    return { checked: 0, updated: 0 };
  }

  const existingAI = await aiRepository.getLatestManyByArticleIds(candidates.map((article) => article.id));
  const needsEnrichment = candidates
    .filter((article) => {
      const existing = existingAI.get(article.id);
      return !existing || !existing.summary || !existing.key_takeaways;
    })
    .slice(0, AI_ENRICHMENT_BACKFILL_BATCH_SIZE);

  if (needsEnrichment.length === 0) {
    return { checked: candidates.length, updated: 0 };
  }

  const results = await Promise.allSettled(
    needsEnrichment.map(async (article) => {
      const content = article.content ?? article.description;
      const input = { id: article.id, title: article.title, content };
      const [summary, takeaways] = await Promise.all([aiService.getSummary(input), aiService.getKeyTakeaways(input)]);
      return { article, content, summary, takeaways };
    })
  );

  const aiInputs: ArticleAIInput[] = [];
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`[admin-runtime-ops-service] AI enrichment backfill failed for "${needsEnrichment[index].title}":`, result.reason);
      return;
    }

    const { article, content, summary, takeaways } = result.value;
    if (!summary && !takeaways) return;

    const cacheKey = hashArticleContent(article.title, content);
    const existing = existingAI.get(article.id);
    const sameVersion = existing?.cache_key === cacheKey;

    aiInputs.push({
      articleId: article.id,
      summary: summary?.summary ?? (sameVersion ? existing?.summary ?? null : null),
      tldr: sameVersion ? existing?.tldr ?? null : null,
      longSummary: sameVersion ? existing?.long_summary ?? null : null,
      rewrittenArticle: sameVersion ? existing?.rewritten_article ?? null : null,
      entities: sameVersion ? existing?.entities ?? null : null,
      keyTakeaways: takeaways ? { points: takeaways.points } : sameVersion ? existing?.key_takeaways ?? null : null,
      tags: sameVersion ? existing?.tags ?? [] : [],
      sentiment: sameVersion ? existing?.sentiment ?? null : null,
      bias: sameVersion ? existing?.bias ?? null : null,
      provider: summary?.provider ?? takeaways?.provider ?? existing?.provider ?? "unknown",
      model: existing?.model ?? "",
      promptVersion: summary?.version ?? takeaways?.version ?? existing?.prompt_version ?? "",
      cacheKey,
    });
  });

  if (aiInputs.length > 0) {
    await aiRepository.bulkUpsert(aiInputs);
  }

  return { checked: needsEnrichment.length, updated: aiInputs.length };
}
