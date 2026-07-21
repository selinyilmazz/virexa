import {
  aiEntitiesJob,
  aiKeyTakeawaysJob,
  aiLongSummaryJob,
  aiRewriteJob,
  aiSummaryJob,
  aiTagJob,
  aiTldrJob,
  biasAnalysisJob,
  sentimentJob,
} from "@/runtime/jobs/ai-jobs";
import {
  duplicateDetectionJob,
  gNewsSyncJob,
  hnSyncJob,
  newsApiSyncJob,
  newsFetchJob,
  rssSyncJob,
  trendingJob,
} from "@/runtime/jobs/news-jobs";
import { cacheRefreshJob, cleanupJob, createHealthCheckJob } from "@/runtime/jobs/system-jobs";
import type { QueueJobStatus } from "@/runtime/queue/runtime-queue";
import type { JobDefinition, JobType } from "@/runtime/types";

export {
  newsFetchJob,
  rssSyncJob,
  newsApiSyncJob,
  gNewsSyncJob,
  hnSyncJob,
  duplicateDetectionJob,
  trendingJob,
} from "@/runtime/jobs/news-jobs";
export {
  aiSummaryJob,
  aiTldrJob,
  aiKeyTakeawaysJob,
  aiLongSummaryJob,
  aiRewriteJob,
  aiEntitiesJob,
  aiTagJob,
  sentimentJob,
  biasAnalysisJob,
} from "@/runtime/jobs/ai-jobs";
export { cacheRefreshJob, cleanupJob, createHealthCheckJob } from "@/runtime/jobs/system-jobs";

/** Every AI capability job type, in the order the Admin Dashboard/cron trigger them - used by `/api/cron/ai-enrichment` to fire all 9 in parallel without hardcoding the list a second time. */
export const AI_ENRICHMENT_JOB_TYPES: readonly JobType[] = [
  "ai-summary",
  "ai-tldr",
  "ai-key-takeaways",
  "ai-long-summary",
  "ai-rewrite",
  "ai-entities",
  "ai-tag",
  "sentiment",
  "bias-analysis",
];

/**
 * Builds the full 19-job registry keyed by `JobType`. A factory
 * (rather than a plain static object) purely because `health-check`
 * needs access to the live `RuntimeQueue`'s stats - see
 * `createHealthCheckJob`'s doc in `runtime/jobs/system-jobs.ts` for why
 * that's passed in rather than imported directly. `runtime/engine.ts`
 * calls this once, with its own queue, when it starts up.
 */
export function createJobRegistry(deps: { getQueueStats: () => Record<QueueJobStatus, number> }): Record<JobType, JobDefinition> {
  return {
    "news-fetch": newsFetchJob,
    "rss-sync": rssSyncJob,
    "newsapi-sync": newsApiSyncJob,
    "gnews-sync": gNewsSyncJob,
    "hn-sync": hnSyncJob,
    "duplicate-detection": duplicateDetectionJob,
    "ai-summary": aiSummaryJob,
    "ai-tldr": aiTldrJob,
    "ai-key-takeaways": aiKeyTakeawaysJob,
    "ai-long-summary": aiLongSummaryJob,
    "ai-rewrite": aiRewriteJob,
    "ai-entities": aiEntitiesJob,
    "ai-tag": aiTagJob,
    sentiment: sentimentJob,
    "bias-analysis": biasAnalysisJob,
    trending: trendingJob,
    "cache-refresh": cacheRefreshJob,
    cleanup: cleanupJob,
    "health-check": createHealthCheckJob(deps.getQueueStats),
  };
}
