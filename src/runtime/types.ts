import { RuntimeCancelledError } from "@/runtime/errors";

/**
 * The 19 background job types Virexa's runtime layer knows how to run
 * (see `src/runtime/jobs/`). Originally 13, matching the user-specified
 * list verbatim; `"hn-sync"` was added alongside the Hacker News
 * integration (News Engine & Search production-readiness phase) as the
 * 14th, following the exact same pattern as `rss-sync`/`newsapi-sync`/
 * `gnews-sync`. Kebab-case to line up with the cron/config naming used
 * throughout this module.
 *
 * Production architecture fix (decoupled AI enrichment): `"ai-summary"`,
 * `"ai-tag"`, `"sentiment"`, and `"bias-analysis"` used to run against
 * the legacy in-memory `live-articles` cache (never written to Supabase -
 * see the old `schedule-definitions.ts` doc comment) and are now
 * DB-backed, independent AI enrichment jobs instead (`runtime/jobs/ai-jobs.ts`,
 * `services/ai/ai-enrichment-runner.ts`) - same job type names (no
 * `runtime_job_runs` history/Admin Dashboard naming churn), completely
 * different bodies. `"ai-tldr"`, `"ai-key-takeaways"`, `"ai-long-summary"`,
 * `"ai-rewrite"`, and `"ai-entities"` are 5 new job types for the
 * remaining AI capabilities that used to run inline inside `news-fetch`
 * itself (`pipeline/steps/ai-steps.ts`, now deleted) - the actual root
 * cause of `news-fetch` hanging past Vercel's 300s `maxDuration` with
 * only "provider timeout" ever appearing in the logs. Every AI capability
 * is now its own job/queue: "Summary, Key Takeaways, Tags, Entities,
 * Sentiment, Rewrite birbirinden bağımsız queue olsun."
 */
export type JobType =
  | "news-fetch"
  | "rss-sync"
  | "newsapi-sync"
  | "gnews-sync"
  | "hn-sync"
  | "duplicate-detection"
  | "ai-summary"
  | "ai-tldr"
  | "ai-key-takeaways"
  | "ai-long-summary"
  | "ai-rewrite"
  | "ai-entities"
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
  "ai-tldr",
  "ai-key-takeaways",
  "ai-long-summary",
  "ai-rewrite",
  "ai-entities",
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
  /**
   * Per-job-type override for the queue's per-attempt timeout
   * (`RuntimeQueue`'s `timeoutMs`, raced via `withTimeout` in
   * `runtime/retry.ts`). Falls back to the single global
   * `runtimeConfig.jobTimeoutMs` (`JOB_TIMEOUT` env var, default 30s)
   * when absent - production root-cause fix: every job type used to
   * share that one 30s default regardless of how much work it actually
   * does, which is fine for `health-check`/`cache-refresh` but far too
   * short for `news-fetch` (RSS/NewsAPI/GNews/HN fetch + image/content
   * extraction + database writes) - it was timing out and being retried
   * 3x (`RuntimeJobError: "news-fetch" timed out after 30000ms`) even
   * after the pipeline's own bottlenecks were parallelized. Stay safely
   * under `vercel.json`'s cron route `maxDuration` (300s) for any job
   * triggered that way.
   */
  timeoutMs?: number;
  /**
   * Per-job-type override for the queue's retry count (`RuntimeQueue`'s
   * `maxAttempts`). Falls back to the single global `runtimeConfig.maxRetry`
   * (`MAX_RETRY` env var, default 3) when absent.
   *
   * Production architecture fix: `timeoutMs x maxAttempts` is each job's
   * real worst-case wall time (every attempt individually timing out,
   * then retried) - for a job invoked from a Vercel Cron route that
   * `await`s it to completion (`runJob`, not fire-and-forget
   * `enqueueJob`), that worst case must stay under the route's own
   * `maxDuration` (300s), or Vercel kills the function mid-retry with no
   * chance for any in-flight code (including the queue's own failure
   * logging) to run. The global default of 3 retries made sense for
   * lightweight jobs, but `news-fetch` (`timeoutMs: 180_000`) and every
   * AI enrichment job (`timeoutMs: 90_000`, see `runtime/jobs/ai-jobs.ts`)
   * set this to `1` - a single attempt only. Serverless cron's own next
   * scheduled tick (or the Admin Dashboard's "Retry Failed Jobs" button)
   * is the retry mechanism for these, not an in-process backoff loop
   * that can itself blow the time budget it's trying to respect.
   */
  maxAttempts?: number;
};
