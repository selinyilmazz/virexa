import { RuntimeCancelledError, RuntimeJobError } from "@/runtime/errors";
import type { RuntimeLogger } from "@/runtime/logger";
import { withRetry } from "@/runtime/retry";
import { createCancelToken } from "@/runtime/types";
import type { CancelToken, JobHandler, JobPriority, JobRunContext, JobType } from "@/runtime/types";

/**
 * General-purpose job queue for the runtime layer, supporting Priority,
 * Retry, Concurrency, and Delay ("Queue sistemini genişlet ... Priority,
 * Retry, Concurrency, Delay özellikleri eklenmeli").
 *
 * This is a NEW, more capable queue rather than an edit of the existing
 * `lib/ai/ai-queue.ts` (which stays completely untouched, still backing
 * the AI layer's own bulk-generation use case). `AIQueue` is a simple
 * FIFO-with-retry drain loop; `RuntimeQueue` additionally needs
 * priority ordering, bounded concurrency, and delayed scheduling, which
 * would have meant rewriting most of `AIQueue`'s internals anyway - so
 * this class lives in `runtime/queue/` instead, built on the shared
 * `withRetry` primitive so both queues still retry the same way.
 *
 * Entries are process-local (a `Map`), same tradeoff as `TTLCache`/
 * `AICache`/`AIQueue`: no cross-instance coherency yet, swappable for a
 * persistent store later without changing callers. `onEntryFinished`
 * (optional, see the constructor) is that swap point: `runtime/engine.ts`
 * passes a callback that persists each finished entry to the
 * `runtime_job_runs` table, so the Admin Dashboard's "Last Run/Last
 * Success/Last Error" cards survive process restarts even though this
 * in-memory `Map` itself still doesn't - this class stays completely
 * unaware of Supabase/repositories either way.
 */

export type QueueJobStatus = "queued" | "delayed" | "running" | "completed" | "failed" | "cancelled";

export type RuntimeQueueEntry = {
  id: string;
  jobType: JobType;
  priority: JobPriority;
  status: QueueJobStatus;
  enqueuedAt: string;
  /** When a delayed job becomes eligible to run. Equal to `enqueuedAt` when `delayMs` wasn't given. */
  runAt: string;
  startedAt?: string;
  finishedAt?: string;
  attempts: number;
  maxAttempts: number;
  timeoutMs: number;
  backoffMs: number;
  lastError?: string;
  cancelToken: CancelToken & { cancel(): void };
};

export type EnqueueOptions = {
  priority?: JobPriority;
  /** Milliseconds to wait before this job becomes eligible to run. */
  delayMs?: number;
  maxAttempts?: number;
  timeoutMs?: number;
  backoffMs?: number;
};

const PRIORITY_RANK: Record<JobPriority, number> = { high: 0, normal: 1, low: 2 };
const MAX_HISTORY_ENTRIES = 500;

export class RuntimeQueue {
  private readonly entries = new Map<string, RuntimeQueueEntry>();
  private readonly handlers = new Map<string, JobHandler>();
  private readonly results = new Map<string, unknown>();
  private runningCount = 0;

  constructor(
    private readonly logger: RuntimeLogger,
    private readonly concurrency: number,
    private readonly defaultMaxAttempts: number,
    private readonly defaultTimeoutMs: number,
    private readonly defaultBackoffMs = 2000,
    /** Called once a job settles (completed/failed/cancelled-while-running) with its final entry snapshot. Optional - a queue with no persistence callback behaves exactly as before. Never awaited and never allowed to throw into the queue's own run loop (see `runEntry()`). */
    private readonly onEntryFinished?: (entry: RuntimeQueueEntry) => void
  ) {}

  /** Adds a job to the queue and returns its id. Runs as soon as a concurrency slot and priority order allow (immediately, if the queue is idle). */
  enqueue(jobType: JobType, handler: JobHandler, options: EnqueueOptions = {}): string {
    const id = `${jobType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const delayMs = Math.max(0, options.delayMs ?? 0);
    const now = Date.now();

    const entry: RuntimeQueueEntry = {
      id,
      jobType,
      priority: options.priority ?? "normal",
      status: delayMs > 0 ? "delayed" : "queued",
      enqueuedAt: new Date(now).toISOString(),
      runAt: new Date(now + delayMs).toISOString(),
      attempts: 0,
      maxAttempts: Math.max(1, options.maxAttempts ?? this.defaultMaxAttempts),
      timeoutMs: options.timeoutMs ?? this.defaultTimeoutMs,
      backoffMs: options.backoffMs ?? this.defaultBackoffMs,
      cancelToken: createCancelToken(),
    };

    this.entries.set(id, entry);
    this.handlers.set(id, handler);

    if (delayMs > 0) {
      // Belt-and-suspenders: pump() is also called on every enqueue/completion,
      // but if the queue is otherwise idle nothing would re-check a delayed
      // job until its delay elapses without this timer.
      setTimeout(() => this.pump(), delayMs + 10);
    }

    this.pump();
    return id;
  }

  /** Requests cancellation. A queued/delayed job is cancelled immediately; a running job's cancel token is flipped so its retry loop stops after the current attempt (cooperative - see `CancelToken` doc). */
  cancel(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    if (entry.status === "completed" || entry.status === "failed" || entry.status === "cancelled") {
      return false;
    }

    entry.cancelToken.cancel();
    if (entry.status === "queued" || entry.status === "delayed") {
      entry.status = "cancelled";
      entry.finishedAt = new Date().toISOString();
      this.logger.logCancelled(entry.jobType, "cancelled before it started running");
    }
    return true;
  }

  get(id: string): RuntimeQueueEntry | undefined {
    return this.entries.get(id);
  }

  getResult(id: string): unknown {
    return this.results.get(id);
  }

  list(status?: QueueJobStatus): RuntimeQueueEntry[] {
    const all = [...this.entries.values()];
    return status ? all.filter((entry) => entry.status === status) : all;
  }

  /** Snapshot counts per status - used by the health monitor to report on queue backlog/failures. */
  getStats(): Record<QueueJobStatus, number> {
    const stats: Record<QueueJobStatus, number> = {
      queued: 0,
      delayed: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };
    for (const entry of this.entries.values()) {
      stats[entry.status] += 1;
    }
    return stats;
  }

  private promoteDelayedJobs(): void {
    const now = Date.now();
    for (const entry of this.entries.values()) {
      if (entry.status === "delayed" && new Date(entry.runAt).getTime() <= now) {
        entry.status = "queued";
      }
    }
  }

  private pickNext(): RuntimeQueueEntry | undefined {
    this.promoteDelayedJobs();

    const candidates = [...this.entries.values()].filter((entry) => entry.status === "queued");
    if (candidates.length === 0) return undefined;

    candidates.sort((a, b) => {
      const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (rankDiff !== 0) return rankDiff;
      return new Date(a.enqueuedAt).getTime() - new Date(b.enqueuedAt).getTime();
    });

    return candidates[0];
  }

  private pump(): void {
    this.pruneHistory();

    while (this.runningCount < this.concurrency) {
      const next = this.pickNext();
      if (!next) return;

      next.status = "running";
      next.startedAt = new Date().toISOString();
      this.runningCount += 1;

      void this.runEntry(next).finally(() => {
        this.runningCount -= 1;
        this.pump();
      });
    }
  }

  /** Best-effort notification to `onEntryFinished` - swallows any error the callback itself throws (e.g. a Supabase write failing) so a persistence problem can never affect the job that just ran or the queue's own run loop. */
  private notifyFinished(entry: RuntimeQueueEntry): void {
    if (!this.onEntryFinished) return;
    try {
      this.onEntryFinished(entry);
    } catch (error) {
      console.error(`[RuntimeQueue] onEntryFinished callback failed for "${entry.jobType}":`, error);
    }
  }

  private async runEntry(entry: RuntimeQueueEntry): Promise<void> {
    const handler = this.handlers.get(entry.id);
    const startedAt = Date.now();

    if (!handler) {
      entry.status = "failed";
      entry.lastError = "No handler registered for this job";
      entry.finishedAt = new Date().toISOString();
      this.notifyFinished(entry);
      return;
    }

    this.logger.logStart(entry.jobType, entry.attempts + 1);

    try {
      const ctx: JobRunContext = {
        jobType: entry.jobType,
        attempt: entry.attempts + 1,
        cancelToken: entry.cancelToken,
      };

      const result = await withRetry(entry.jobType, () => handler(ctx), {
        maxAttempts: entry.maxAttempts,
        backoffMs: entry.backoffMs,
        timeoutMs: entry.timeoutMs,
        cancelToken: entry.cancelToken,
        onRetry: (attempt, error) => {
          entry.attempts = attempt;
          this.logger.logRetry(entry.jobType, attempt, error);
        },
      });

      entry.attempts += 1;
      entry.status = "completed";
      entry.finishedAt = new Date().toISOString();
      this.results.set(entry.id, result);
      this.logger.logSuccess(entry.jobType, Date.now() - startedAt, entry.attempts);
    } catch (error) {
      entry.finishedAt = new Date().toISOString();

      if (error instanceof RuntimeCancelledError) {
        entry.status = "cancelled";
        this.logger.logCancelled(entry.jobType, error.message);
        this.notifyFinished(entry);
        return;
      }

      entry.attempts = entry.maxAttempts;
      entry.status = "failed";
      // Wrap as `RuntimeJobError` once retries are exhausted - this is
      // the "job wrapper failed after N attempts" error described in
      // `runtime/errors.ts`'s doc comment for that class.
      const jobError = new RuntimeJobError(entry.jobType, entry.attempts, error);
      entry.lastError = jobError.message;
      this.logger.logFailure(entry.jobType, Date.now() - startedAt, entry.attempts, jobError);
    } finally {
      this.handlers.delete(entry.id);
    }

    this.notifyFinished(entry);
  }

  /** Keeps the entries map bounded in a long-lived process: drops the oldest finished (completed/failed/cancelled) entries once history grows past `MAX_HISTORY_ENTRIES`, oldest first. Never drops queued/delayed/running jobs. */
  private pruneHistory(): void {
    if (this.entries.size <= MAX_HISTORY_ENTRIES) return;

    const finished = [...this.entries.values()]
      .filter((entry) => entry.status === "completed" || entry.status === "failed" || entry.status === "cancelled")
      .sort((a, b) => new Date(a.finishedAt ?? a.enqueuedAt).getTime() - new Date(b.finishedAt ?? b.enqueuedAt).getTime());

    const overflow = this.entries.size - MAX_HISTORY_ENTRIES;
    for (const entry of finished.slice(0, overflow)) {
      this.entries.delete(entry.id);
      this.results.delete(entry.id);
    }
  }
}
