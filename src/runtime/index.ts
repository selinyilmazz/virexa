/**
 * Barrel for Virexa's Production Runtime and Automation layer.
 * Everything under `src/runtime/` is orchestration on top of the
 * existing news (`services/news`, `lib/news`) and AI (`services/ai`,
 * `lib/ai`) layers - it doesn't duplicate or replace either.
 *
 * `runtimeEngine` (from `runtime/engine.ts`) is the one entry point
 * most callers need: `runtimeEngine.runJob("rss-sync")`,
 * `runtimeEngine.start()`, `runtimeEngine.checkHealth()`, etc. Nothing
 * in this module auto-starts anything - see `engine.ts`'s doc comment.
 */

export { RuntimeEngine, runtimeEngine } from "@/runtime/engine";
export type { EnqueueJobOptions } from "@/runtime/engine";

export { resolveRuntimeConfig, runtimeConfig } from "@/runtime/config";
export type { RuntimeConfig } from "@/runtime/config";

export { RuntimeLogger, runtimeLogger } from "@/runtime/logger";
export type { RuntimeLogEntry, RuntimeLogEvent, RuntimeLogListener } from "@/runtime/logger";

export {
  RuntimeCancelledError,
  RuntimeConfigError,
  RuntimeError,
  RuntimeJobError,
  RuntimeTimeoutError,
} from "@/runtime/errors";

export { withRetry, withTimeout } from "@/runtime/retry";
export type { RetryOptions } from "@/runtime/retry";

export { createCancelToken, JOB_TYPES } from "@/runtime/types";
export type {
  CancelToken,
  JobDefinition,
  JobHandler,
  JobPriority,
  JobRunContext,
  JobRunStatus,
  JobRunSummary,
  JobType,
} from "@/runtime/types";

export { RuntimeQueue } from "@/runtime/queue/runtime-queue";
export type { EnqueueOptions, QueueJobStatus, RuntimeQueueEntry } from "@/runtime/queue/runtime-queue";

export { runNewsPipeline } from "@/runtime/pipeline/news-pipeline";
export type { NewsPipelineResult } from "@/runtime/pipeline/news-pipeline";
export type { PipelineStepName, PipelineStepResult } from "@/runtime/pipeline/types";

export { createJobRegistry } from "@/runtime/jobs";

export { RuntimeScheduler } from "@/runtime/scheduler/scheduler";
export { SCHEDULE_DEFINITIONS } from "@/runtime/scheduler/schedule-definitions";
export type { ScheduleDefinition } from "@/runtime/scheduler/schedule-definitions";

export { checkSystemHealth } from "@/runtime/health/health-monitor";
export type { HealthCheckId, HealthCheckResult, HealthReport, HealthStatus } from "@/runtime/health/health-monitor";
