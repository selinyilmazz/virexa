import { env } from "@/lib/env";
import { AICache } from "@/lib/ai";
import { AIQueue } from "@/lib/ai";
import { aiProvider } from "@/services/ai/ai-provider-instance";
import { AIService } from "@/services/ai/ai-service";

/**
 * Shared AI result cache backing `aiService` below. Exported on its own
 * (rather than only living inline inside `AIService`'s constructor
 * call, as before) purely so the runtime layer's `CleanupJob`
 * (`runtime/jobs/system-jobs.ts`) can call `aiCache.pruneExpired()`
 * without reaching into `AIService`'s private fields. Additive only -
 * `aiService`'s behavior/signature is unchanged.
 */
export const aiCache = new AICache(env.ai.cacheTtlMs);

/**
 * Default, ready-to-use `AIService` instance wired with the configured
 * provider (or `null` if unconfigured - see `ai-provider-instance.ts`)
 * and `aiCache` above. Import this, not `AIService` directly, from
 * anywhere that needs AI results - mirrors
 * `services/news/aggregator-instance.ts`'s singleton pattern.
 */
export const aiService = new AIService(aiProvider, aiCache);

/**
 * Shared queue for AI jobs that should run outside a request/response
 * cycle (e.g. bulk-generating summaries for newly-ingested articles).
 * Not wired to a cron trigger itself - the runtime layer
 * (`src/runtime/`) is what schedules AI work now, via its own
 * `RuntimeQueue` - but this stays available for direct/manual use the
 * same way it always was.
 */
export const aiQueue = new AIQueue();
