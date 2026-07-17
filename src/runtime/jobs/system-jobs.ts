import { cacheRefreshStep } from "@/runtime/pipeline/steps/finalize-steps";
import { checkSystemHealth } from "@/runtime/health/health-monitor";
import type { QueueJobStatus } from "@/runtime/queue/runtime-queue";
import type { JobDefinition } from "@/runtime/types";
import { aiCache } from "@/services/ai";

export const cacheRefreshJob: JobDefinition = {
  type: "cache-refresh",
  description: "Forces an immediate refresh of the live-articles cache.",
  run: async () => {
    const result = await cacheRefreshStep();
    if (!result.success) throw new Error(result.error ?? "Cache refresh failed");
    return result.data;
  },
};

/** Prunes expired `AICache` entries. `TTLCache` (live-articles) and `RuntimeQueue` history already self-prune lazily on their own (see their respective classes), so the AI cache is the one store that benefits from an explicit periodic sweep in a long-lived process. */
export const cleanupJob: JobDefinition = {
  type: "cleanup",
  description: "Prunes expired AI cache entries.",
  run: async () => {
    const before = aiCache.size;
    const removed = aiCache.pruneExpired();
    return { before, removed, after: aiCache.size };
  },
};

/**
 * Factory rather than a static export: `checkSystemHealth()` needs the
 * live `RuntimeQueue`'s stats (see `health-monitor.ts`), and this
 * module intentionally has no import of `runtime/engine.ts`'s queue
 * singleton to avoid a circular dependency (engine -> job registry ->
 * queue instance -> engine). `runtime/jobs/index.ts` calls this with
 * the engine's own queue when building the job registry.
 */
export function createHealthCheckJob(getQueueStats: () => Record<QueueJobStatus, number>): JobDefinition {
  return {
    type: "health-check",
    description: "Checks RSS/NewsAPI/GNews/AI Provider/Database/Cache/Queue health.",
    run: async () => checkSystemHealth(getQueueStats),
  };
}
