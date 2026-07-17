import { RuntimeCancelledError } from "@/runtime/errors";

/**
 * The 14 background job types Virexa's runtime layer knows how to run
 * (see `src/runtime/jobs/`). Originally 13, matching the user-specified
 * list verbatim; `"hn-sync"` was added alongside the Hacker News
 * integration (News Engine & Search production-readiness phase) as the
 * 14th, following the exact same pattern as `rss-sync`/`newsapi-sync`/
 * `gnews-sync`. Kebab-case to line up with the cron/config naming used
 * throughout this module.
 */
export type JobType =
  | "news-fetch"
  | "rss-sync"
  | "newsapi-sync"
  | "gnews-sync"
  | "hn-sync"
  | "duplicate-detection"
  | "ai-summary"
  | "ai-tag"
  | "sentiment"
  | "bias-analysis"
  | "trending"
  | "cache-refresh"
  | "cleanup"
  | "health-check";

export const JOB_TYPES: readonly JobType[] = [
  "news-fetch",
  "rss-sync",
  "newsapi-sync",
  "gnews-sync",
  "hn-sync",
  "duplicate-detection",
  "ai-summary",
  "ai-tag",
  "sentiment",
  "bias-analysis",
  "trending",
  "cache-refresh",
  "cleanup",
  "health-check",
];

export type JobPriority = "high" | "normal" | "low";

export type JobRunStatus = "completed" | "failed" | "cancelled";

/** Result of a single job run, returned by `RuntimeEngine.runJob()` and recorded by `RuntimeLogger`. */
export type JobRunSummary = {
  jobType: JobType;
  status: JobRunStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  attempts: number;
  error?: string;
  data?: unknown;
};

/**
 * Cooperative cancellation primitive. Nothing in the existing news/AI
 * layers accepts a real `AbortSignal` today - their own timeout helpers
 * (`lib/news/fetch-with-timeout.ts`, `lib/ai/http.ts`) own their
 * timeouts internally - so "cancel" here means "stop waiting for this
 * job and discard its eventual result," not "abort the underlying
 * network request." That's sufficient for the runtime's purposes: a
 * cancelled job's retry loop (`runtime/retry.ts`) exits immediately
 * instead of starting another attempt.
 */
export type CancelToken = {
  readonly isCancelled: boolean;
  throwIfCancelled(): void;
};

export function createCancelToken(): CancelToken & { cancel(): void } {
  let cancelled = false;
  return {
    get isCancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
    throwIfCancelled() {
      if (cancelled) {
        throw new RuntimeCancelledError("job");
      }
    },
  };
}

export type JobRunContext = {
  jobType: JobType;
  attempt: number;
  cancelToken: CancelToken;
};

/**
 * A single job's executable body. Must throw on failure (never resolve
 * with an error value) so the queue's retry logic engages - see
 * `runtime/queue/runtime-queue.ts`.
 */
export type JobHandler = (ctx: JobRunContext) => Promise<unknown>;

export type JobDefinition = {
  type: JobType;
  description: string;
  run: JobHandler;
};
