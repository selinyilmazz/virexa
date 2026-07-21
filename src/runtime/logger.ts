import { describeError } from "@/runtime/errors";
import type { JobType } from "@/runtime/types";

export type RuntimeLogEvent = "start" | "success" | "failure" | "retry" | "cancelled";

export type RuntimeLogEntry = {
  jobType: JobType | "runtime";
  event: RuntimeLogEvent;
  timestamp: string;
  durationMs?: number;
  attempt?: number;
  retryCount?: number;
  message?: string;
};

export type RuntimeLogListener = (entry: RuntimeLogEntry) => void;

const MAX_HISTORY = 500;

/**
 * Central logger for the runtime layer: every job records its start,
 * end, duration, success/failure, retry count, and error message here
 * ("Her job için start, end, duration, success, failure, retry count,
 * error message tutulmalı").
 *
 * Console-based today, but every entry also fans out to any subscriber
 * registered via `subscribe()` - wiring a Sentry (or any other) sink
 * later is just calling `runtimeLogger.subscribe(sendToSentry)` once,
 * with zero changes to any job/queue/engine code that logs through this
 * class ("İleride Sentry gibi sistemlere bağlanabilecek şekilde
 * tasarlanmalı").
 */
export class RuntimeLogger {
  private readonly history: RuntimeLogEntry[] = [];
  private readonly listeners = new Set<RuntimeLogListener>();

  /** Register a sink for every future log entry. Returns an unsubscribe function. */
  subscribe(listener: RuntimeLogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(entry: RuntimeLogEntry): void {
    this.history.push(entry);
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (error) {
        console.error("[RuntimeLogger] a subscriber threw - ignoring so logging never breaks a job:", error);
      }
    }
    this.writeToConsole(entry);
  }

  private writeToConsole(entry: RuntimeLogEntry): void {
    const prefix = `[runtime:${entry.jobType}]`;
    switch (entry.event) {
      case "start":
        console.info(`${prefix} start (attempt ${entry.attempt ?? 1})`);
        return;
      case "success":
        console.info(`${prefix} success in ${entry.durationMs}ms (attempt ${entry.attempt ?? 1})`);
        return;
      case "retry":
        console.warn(`${prefix} retry #${entry.retryCount} after error: ${entry.message}`);
        return;
      case "failure":
        console.error(`${prefix} failed after ${entry.attempt ?? 1} attempt(s) in ${entry.durationMs}ms: ${entry.message}`);
        return;
      case "cancelled":
        console.warn(`${prefix} cancelled${entry.message ? `: ${entry.message}` : ""}`);
    }
  }

  logStart(jobType: JobType | "runtime", attempt = 1): void {
    this.emit({ jobType, event: "start", timestamp: new Date().toISOString(), attempt });
  }

  logSuccess(jobType: JobType | "runtime", durationMs: number, attempt = 1): void {
    this.emit({ jobType, event: "success", timestamp: new Date().toISOString(), durationMs, attempt });
  }

  logRetry(jobType: JobType | "runtime", retryCount: number, error: unknown): void {
    this.emit({
      jobType,
      event: "retry",
      timestamp: new Date().toISOString(),
      retryCount,
      // Bug fix: was `error instanceof Error ? error.message : String(error)` -
      // `String()` on a non-Error value (e.g. a Supabase error object)
      // always produces "[object Object]". See `describeError()`'s doc
      // comment in `runtime/errors.ts`.
      message: describeError(error),
    });
  }

  logFailure(jobType: JobType | "runtime", durationMs: number, attempt: number, error: unknown): void {
    this.emit({
      jobType,
      event: "failure",
      timestamp: new Date().toISOString(),
      durationMs,
      attempt,
      message: describeError(error),
    });
  }

  logCancelled(jobType: JobType | "runtime", message?: string): void {
    this.emit({ jobType, event: "cancelled", timestamp: new Date().toISOString(), message });
  }

  /** Most recent entries, newest last - useful for a future debug endpoint/UI (none added this turn). */
  getRecent(limit = 50): RuntimeLogEntry[] {
    return this.history.slice(-limit);
  }

  clear(): void {
    this.history.length = 0;
  }
}

/** Shared singleton - import this from every job/queue/engine module (mirrors `aiService`/`newsAggregator`'s singleton pattern). */
export const runtimeLogger = new RuntimeLogger();
