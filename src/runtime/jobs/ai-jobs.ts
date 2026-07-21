import { runAIEnrichmentCapability } from "@/services/ai/ai-enrichment-runner";
import type { AICapabilityKey } from "@/services/ai/ai-enrichment-runner";
import type { JobDefinition } from "@/runtime/types";

/**
 * The 9 independent AI enrichment jobs (production architecture fix -
 * "Summary, Key Takeaways, Tags, Entities, Sentiment, Rewrite birbirinden
 * bağımsız queue olsun"). Every job here is a thin wrapper around the
 * ONE shared function that actually does the work,
 * `runAIEnrichmentCapability()` (`services/ai/ai-enrichment-runner.ts`) -
 * the same function the Admin Runtime "Backfill AI Enrichment" button
 * calls (via `runAllAIEnrichmentCapabilities`), so there is exactly one
 * implementation of "select articles missing this field, generate with
 * controlled concurrency, persist" for the whole app (goal: "kod tekrarı
 * olmasın").
 *
 * Previously (`ai-summary`/`ai-tag`/`sentiment`/`bias-analysis` only,
 * before this phase) these 4 job types ran against the legacy in-memory
 * `live-articles` cache and never wrote to Supabase at all - see the old
 * `schedule-definitions.ts` doc comment, "found during the Scheduler
 * Stopped / no new articles production incident". They're repointed here
 * at the real, DB-backed enrichment path instead, and 5 new job types
 * (`ai-tldr`, `ai-key-takeaways`, `ai-long-summary`, `ai-rewrite`,
 * `ai-entities`) cover the AI capabilities that used to run inline inside
 * `news-fetch` itself (`pipeline/steps/ai-steps.ts`, now deleted - see
 * `runtime/pipeline/news-pipeline.ts`'s doc comment for why that was the
 * actual root cause of `news-fetch` hanging past Vercel's `maxDuration`).
 *
 * `timeoutMs: 90_000, maxAttempts: 1` on every job here (production
 * architecture fix - "Hiçbir job Vercel'in 300 saniye sınırını aşmasın"):
 * `runAIEnrichmentCapability()`'s batch size (20) and internal
 * concurrency (5, see that file) bound one attempt to roughly 60s even in
 * the worst case (every single call hitting `AI_TIMEOUT`), so `90_000`
 * leaves real margin while still comfortably fitting under 300s with
 * `maxAttempts: 1` - no in-job retry loop that could multiply toward the
 * ceiling. The next cron tick (`/api/cron/ai-enrichment`, scheduled
 * independently of `news-fetch`) or the Admin Dashboard's "Retry Failed
 * Jobs" button picks up anything a failed attempt left un-enriched -
 * articles that still don't have {this field} are exactly the candidates
 * `runAIEnrichmentCapability` selects again next time, so nothing is
 * lost, just deferred to the next pass. This is also precisely how the
 * whole system's AI backlog gradually clears rather than needing to
 * finish in one shot ("AI işlemlerinin arka planda kademeli olarak
 * bitmesi").
 */

function createAICapabilityJob(capability: AICapabilityKey, jobType: JobDefinition["type"], label: string): JobDefinition {
  return {
    type: jobType,
    description: `Generates/refreshes AI ${label} for already-persisted articles still missing it (bounded batch, controlled concurrency).`,
    timeoutMs: 90_000,
    maxAttempts: 1,
    run: async () => {
      const result = await runAIEnrichmentCapability(capability);
      return result;
    },
  };
}

export const aiSummaryJob = createAICapabilityJob("summary", "ai-summary", "Summary");
export const aiTldrJob = createAICapabilityJob("tldr", "ai-tldr", "TL;DR");
export const aiKeyTakeawaysJob = createAICapabilityJob("keyTakeaways", "ai-key-takeaways", "Key Takeaways");
export const aiLongSummaryJob = createAICapabilityJob("longSummary", "ai-long-summary", "Long Summary");
export const aiRewriteJob = createAICapabilityJob("rewrite", "ai-rewrite", "Article Rewrite");
export const aiEntitiesJob = createAICapabilityJob("entities", "ai-entities", "Entities");
export const aiTagJob = createAICapabilityJob("tags", "ai-tag", "Tags");
export const sentimentJob = createAICapabilityJob("sentiment", "sentiment", "Sentiment");
export const biasAnalysisJob = createAICapabilityJob("bias", "bias-analysis", "Bias");
