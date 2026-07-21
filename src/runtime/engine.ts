import { runtimeConfig } from "@/runtime/config";
import { checkSystemHealth } from "@/runtime/health/health-monitor";
import type { HealthReport } from "@/runtime/health/health-monitor";
import { createJobRegistry } from "@/runtime/jobs";
import { runtimeLogger } from "@/runtime/logger";
import { RuntimeQueue } from "@/runtime/queue/runtime-queue";
import type { RuntimeQueueEntry } from "@/runtime/queue/runtime-queue";
import { RuntimeScheduler } from "@/runtime/scheduler/scheduler";
import type { JobDefinition, JobPriority, JobRunSummary, JobType } from "@/runtime/types";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createRuntimeJobRunRepository } from "@/repositories/runtime-job-run-repository";

export type EnqueueJobOptions = {
  priority?: JobPriority;
  delayMs?: number;
  /** One-off override, takes priority over the job's own `JobDefinition.timeoutMs` and the global default - see `enqueueJob`'s doc comment for the full resolution order. */
  timeoutMs?: number;
  /** One-off override, takes priority over the job's own `JobDefinition.maxAttempts` and the global `runtimeConfig.maxRetry` default - same resolution order as `timeoutMs` above. */
  maxAttempts?: number;
};

/**
 * Persists one finished queue entry to `runtime_job_runs`
 * (`supabase/migrations/0006_runtime_job_runs.sql`) so the Admin
 * Dashboard's "Last Run/Last Success/Last Error" cards survive process
 * restarts - `RuntimeQueue`'s own entry history is still an in-memory
 * `Map` (see that file's doc comment), which is fine for live queue
 * stats but was the actual cause of "No runs recorded yet" showing up
 * right after a fresh server process's first successful pipeline run
 * ("Memory yerine production uyumlu bir çözüm tasarla").
 *
 * Deliberately fire-and-forget and never throws into the caller
 * (`RuntimeQueue` already wraps `onEntryFinished` itself, but this adds
 * its own try/catch too so a missing service-role key or a transient DB
 * error can never surface as a queue-level problem or affect the job's
 * own already-decided success/failure result). Skips silently (no log
 * spam) when `createServiceClient()` returns `null`, i.e. when
 * `SUPABASE_SERVICE_ROLE_KEY` isn't configured - same "unconfigured is
 * a normal, safe state" convention `health-monitor.ts` already uses.
 */
function persistRuntimeJobRun(entry: RuntimeQueueEntry): void {
  if (entry.status !== "completed" && entry.status !== "failed" && entry.status !== "cancelled") return;

  const supabase = createServiceClient();
  if (!supabase) return;

  const finishedAt = entry.finishedAt ?? new Date().toISOString();
  createRuntimeJobRunRepository(supabase)
    .record({
      jobType: entry.jobType,
      status: entry.status,
      startedAt: entry.startedAt ?? null,
      finishedAt,
      durationMs: entry.startedAt ? new Date(finishedAt).getTime() - new Date(entry.startedAt).getTime() : null,
      attempts: entry.attempts,
      error: entry.lastError ?? null,
    })
    .catch((error) => {
      console.error(`[RuntimeEngine] failed to persist job run for "${entry.jobType}":`, error);
    });
}

/**
 * The central engine that manages every automated task in Virexa's
 * runtime layer: it owns the `RuntimeQueue`, the 13-job registry, and
 * the `RuntimeScheduler`, and is the one place that wires them together
 * ("Runtime Engine tüm otomatik görevleri yönetecek merkezi bir motor
 * olmalı - job'ları çalıştırabilmeli, sıraya koyabilmeli, iptal
 * edebilmeli, retry yapabilmeli, timeout yönetebilmeli, logging
 * tutabilmeli"). Every one of those responsibilities is delegated to an
 * already-built collaborator rather than reimplemented here:
 *  - run / queue / retry / timeout / cancel -> `RuntimeQueue`
 *  - logging -> `runtimeLogger` (shared singleton, passed into the queue)
 *  - scheduling -> `RuntimeScheduler`
 *  - what each job actually does -> the job registry (`runtime/jobs/*`)
 *  - durable run history -> `persistRuntimeJobRun()` above, passed into
 *    `RuntimeQueue` as its optional `onEntryFinished` hook
 *
 * NOT auto-started anywhere in app boot (no `instrumentation.ts` wiring
 * this task, no new API route). `RUNTIME_ENABLED` defaults to `false`,
 * and even when set to `true`, nothing calls `runtimeEngine.start()`
 * automatically - starting it is a deliberate, explicit call (from a
 * future cron trigger, an admin action, or a manual script). This keeps
 * the app's current behavior completely unchanged until someone opts
 * in, and is what "Şimdilik scheduler manuel de tetiklenebilsin" +
 * never breaking the existing app implies.
 */
export class RuntimeEngine {
  readonly queue: RuntimeQueue;
  readonly scheduler: RuntimeScheduler;
  private readonly registry: Record<JobType, JobDefinition>;

  constructor() {
    this.queue = new RuntimeQueue(
      runtimeLogger,
      runtimeConfig.concurrency,
      runtimeConfig.maxRetry,
      runtimeConfig.jobTimeoutMs,
      undefined,
      persistRuntimeJobRun
    );
    this.registry = createJobRegistry({ getQueueStats: () => this.queue.getStats() });
    this.scheduler = new RuntimeScheduler((jobType) => this.enqueueJob(jobType));
  }

  /** Starts every scheduled timer (see `scheduler/schedule-definitions.ts`). Idempotent - calling this again while already running is a no-op. */
  start(): void {
    if (this.scheduler.isRunning) return;
    console.info("[RuntimeEngine] starting scheduler.");
    this.scheduler.start();
  }

  stop(): void {
    this.scheduler.stop();
    console.info("[RuntimeEngine] scheduler stopped.");
  }

  get isRunning(): boolean {
    return this.scheduler.isRunning;
  }

  /**
   * Enqueues one job type by name and returns its queue id immediately
   * (doesn't wait for it to finish). This is the manual-trigger surface
   * the task requires - call it directly, no API route needed.
   *
   * `timeoutMs` resolution (production root-cause fix): an explicit
   * per-call `options.timeoutMs` wins first (kept for callers that need
   * a one-off override), then the job type's own `JobDefinition.timeoutMs`
   * (see that type's doc comment - `news-fetch` sets one, most job types
   * don't and fall through), then the single global
   * `runtimeConfig.jobTimeoutMs` default. Previously this always used
   * the global default for every job type with no way to give a
   * genuinely heavier job (`news-fetch`) more time without raising the
   * timeout for every lightweight job too.
   *
   * `maxAttempts` resolves the same way (production architecture fix -
   * see `JobDefinition.maxAttempts`'s doc comment in `runtime/types.ts`
   * for why some jobs need this pinned to `1`): explicit
   * `options.maxAttempts` first, then the job type's own
   * `JobDefinition.maxAttempts`, then the global `runtimeConfig.maxRetry`.
   * Previously this ignored any override entirely and always used the
   * global default.
   */
  enqueueJob(jobType: JobType, options: EnqueueJobOptions = {}): string {
    const definition = this.registry[jobType];
    return this.queue.enqueue(jobType, definition.run, {
      priority: options.priority,
      delayMs: options.delayMs,
      maxAttempts: options.maxAttempts ?? definition.maxAttempts ?? runtimeConfig.maxRetry,
      timeoutMs: options.timeoutMs ?? definition.timeoutMs ?? runtimeConfig.jobTimeoutMs,
    });
  }

  /** Enqueues a job and waits for it to settle (completed/failed/cancelled), returning a summary - convenient for manual/one-off invocations (a debug script, a future admin action) where the caller wants the result inline instead of polling `queue.get(id)` itself. */
  async runJob(jobType: JobType, options: EnqueueJobOptions = {}): Promise<JobRunSummary> {
    const id = this.enqueueJob(jobType, options);
    return this.waitForJob(id);
  }

  private waitForJob(id: string): Promise<JobRunSummary> {
    const POLL_MS = 50;

    return new Promise((resolve, reject) => {
      const check = (): void => {
        const entry = this.queue.get(id);
        if (!entry) {
          reject(new Error(`Unknown job id "${id}"`));
          return;
        }

        if (entry.status === "completed" || entry.status === "failed" || entry.status === "cancelled") {
          const startedAt = entry.startedAt ?? entry.enqueuedAt;
          const finishedAt = entry.finishedAt ?? new Date().toISOString();
          resolve({
            jobType: entry.jobType,
            status: entry.status,
            startedAt,
            finishedAt,
            durationMs: new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
            attempts: entry.attempts,
            error: entry.lastError,
            data: this.queue.getResult(id),
          });
          return;
        }

        setTimeout(check, POLL_MS);
      };

      check();
    });
  }

  /** Cancels a queued, delayed, or in-flight job (cooperative - see `CancelToken` doc in `runtime/types.ts`). Returns `false` if the id is unknown or the job already settled. */
  cancelJob(id: string): boolean {
    return this.queue.cancel(id);
  }

  /** Runs every health check (RSS/NewsAPI/GNews/AI Provider/Database/Cache/Queue) right now and returns the combined report. */
  async checkHealth(): Promise<HealthReport> {
    return checkSystemHealth(() => this.queue.getStats());
  }

  getJobDefinitions(): Record<JobType, JobDefinition> {
    return this.registry;
  }
}

/**
 * Default, ready-to-use singleton - import this from anywhere that
 * needs to trigger/inspect runtime jobs (mirrors `newsAggregator`'s and
 * `aiService`'s singleton pattern). Constructing it does NOT start
 * anything - see the class doc above.
 */
export const runtimeEngine = new RuntimeEngine();
