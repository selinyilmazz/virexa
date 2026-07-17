/**
 * Error types for Virexa's runtime/automation layer (see `src/runtime/`).
 * Kept separate from the news/AI layers' own error types (`ProviderHttpError`,
 * `AIProviderError`) on purpose - this module's errors describe *job
 * orchestration* failures (timeout, cancellation, retry exhaustion),
 * not the underlying provider failures those other types already
 * classify. A `RuntimeJobError` typically *wraps* one of those.
 */

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}

/** Thrown by `withTimeout()` (see `runtime/retry.ts`) when an attempt exceeds its allotted time. */
export class RuntimeTimeoutError extends RuntimeError {
  constructor(label: string, timeoutMs: number) {
    super(`"${label}" timed out after ${timeoutMs}ms`);
    this.name = "RuntimeTimeoutError";
  }
}

/**
 * Thrown when a job's `CancelToken` is already cancelled before/between
 * retry attempts. Cooperative only - see the `CancelToken` doc in
 * `runtime/types.ts` for what "cancel" means here.
 */
export class RuntimeCancelledError extends RuntimeError {
  constructor(label: string) {
    super(`"${label}" was cancelled`);
    this.name = "RuntimeCancelledError";
  }
}

/**
 * Reserved for future strict-validation use. Today `runtime/config.ts`
 * deliberately never throws this (or anything) - an invalid env value
 * is logged and a safe fallback is used instead, so the app can never
 * crash on startup because of a bad `.env` ("Geçersiz environment
 * değerleri uygulamayı asla çökertmemeli").
 */
export class RuntimeConfigError extends RuntimeError {
  constructor(key: string, reason: string) {
    super(`Invalid runtime config for "${key}": ${reason}`);
    this.name = "RuntimeConfigError";
  }
}

/**
 * Thrown by a job wrapper (see `runtime/jobs/*`) once its underlying
 * `withRetry()` call exhausts every attempt. This is the error type the
 * `RuntimeQueue` catches to mark a job "failed" - a single job throwing
 * this must never stop the queue or any other job from running.
 */
export class RuntimeJobError extends RuntimeError {
  public readonly jobType: string;
  public readonly attempts: number;
  public readonly cause: unknown;

  constructor(jobType: string, attempts: number, cause: unknown) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    super(`Job "${jobType}" failed after ${attempts} attempt(s): ${causeMessage}`);
    this.name = "RuntimeJobError";
    this.jobType = jobType;
    this.attempts = attempts;
    this.cause = cause;
  }
}
