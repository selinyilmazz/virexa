/**
 * A minimal in-memory job queue for AI work (summary/tag/sentiment
 * generation, etc.) that shouldn't run inline on a request. Process-
 * local today - `enqueue()` stores a job and `drain()` runs every
 * pending job with retry - but the job shape (id/status/attempts) is
 * exactly what a persistent queue (DB table, Redis, a real job runner)
 * would need, so swapping the storage later doesn't change any caller.
 * A future cron job would call `drain()` on a schedule ("İleride cron
 * job tarafından kullanılabilecek şekilde tasarla").
 */

export type AIQueueJobStatus = "pending" | "processing" | "completed" | "failed";

export type AIQueueJob<T = unknown> = {
  id: string;
  task: string;
  payload: T;
  status: AIQueueJobStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

export type AIJobHandler<T> = (payload: T) => Promise<void>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AIQueue<T = unknown> {
  private readonly jobs = new Map<string, AIQueueJob<T>>();
  private isDraining = false;

  enqueue(task: string, payload: T, maxAttempts = 3): AIQueueJob<T> {
    const now = new Date().toISOString();
    const job: AIQueueJob<T> = {
      id: `${task}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      task,
      payload,
      status: "pending",
      attempts: 0,
      maxAttempts,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  get(jobId: string): AIQueueJob<T> | undefined {
    return this.jobs.get(jobId);
  }

  list(status?: AIQueueJobStatus): AIQueueJob<T>[] {
    const all = [...this.jobs.values()];
    return status ? all.filter((job) => job.status === status) : all;
  }

  /**
   * Runs every currently-pending job (in insertion order) through
   * `handler`, retrying each up to its `maxAttempts` with linear
   * backoff. Never throws - a job that exhausts its retries is marked
   * `"failed"` and left in place for inspection rather than aborting
   * the whole drain. A second `drain()` call while one is already in
   * flight is a no-op (returns immediately) rather than double-running
   * jobs.
   */
  async drain(handler: AIJobHandler<T>, backoffMs = 1000): Promise<void> {
    if (this.isDraining) return;
    this.isDraining = true;

    try {
      for (const job of this.list("pending")) {
        await this.runJob(job, handler, backoffMs);
      }
    } finally {
      this.isDraining = false;
    }
  }

  private async runJob(job: AIQueueJob<T>, handler: AIJobHandler<T>, backoffMs: number): Promise<void> {
    job.status = "processing";
    job.updatedAt = new Date().toISOString();

    while (job.attempts < job.maxAttempts) {
      job.attempts += 1;
      try {
        await handler(job.payload);
        job.status = "completed";
        job.updatedAt = new Date().toISOString();
        return;
      } catch (error) {
        job.lastError = error instanceof Error ? error.message : String(error);
        job.updatedAt = new Date().toISOString();

        if (job.attempts >= job.maxAttempts) {
          job.status = "failed";
          console.error(
            `[AIQueue] Job "${job.id}" (${job.task}) failed after ${job.attempts} attempt(s): ${job.lastError}`
          );
          return;
        }

        await sleep(backoffMs * job.attempts);
      }
    }
  }
}
