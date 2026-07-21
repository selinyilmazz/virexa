import { inspect } from "node:util";

/**
 * Error types for Virexa's runtime/automation layer (see `src/runtime/`).
 * Kept separate from the news/AI layers' own error types (`ProviderHttpError`,
 * `AIProviderError`) on purpose - this module's errors describe *job
 * orchestration* failures (timeout, cancellation, retry exhaustion),
 * not the underlying provider failures those other types already
 * classify. A `RuntimeJobError` typically *wraps* one of those.
 */

/**
 * Production bug fix ("Vercel logunda Error: [object Object] görünüyor"):
 * the root cause was `String(error)` being used on values that are NOT
 * `Error` instances - most commonly a Supabase/PostgREST error, which is
 * a PLAIN OBJECT (`{ message, code, details, hint }`), not
 * `instanceof Error`. `String()` on a plain object calls its default
 * `Object.prototype.toString()`, which is always the literal string
 * `"[object Object]"` - it does NOT look at the object's own properties.
 * Every place in the runtime layer that turns an unknown thrown/rejected
 * value into a string for a message MUST go through this function
 * instead of `String(error)`/`${error}`/`"Error: " + error`.
 *
 * Order of preference: a real `Error`'s `.message` -> a Supabase-shaped
 * object's own `.message` (plus `.code`/`.details`/`.hint` when present,
 * since those carry the actually-useful diagnostic info Postgres/PostgREST
 * returns) -> `util.inspect(error, { depth: null })` as the final
 * fallback, which recursively prints the real structure of ANY other
 * value (arrays, nested objects, primitives) instead of collapsing it to
 * a useless tag.
 */
export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message.length > 0) {
      const parts = [obj.message];
      if (typeof obj.code === "string" && obj.code) parts.push(`(code: ${obj.code})`);
      if (typeof obj.details === "string" && obj.details) parts.push(`- ${obj.details}`);
      if (typeof obj.hint === "string" && obj.hint) parts.push(`(hint: ${obj.hint})`);
      return parts.join(" ");
    }
  }

  return inspect(error, { depth: null });
}

/**
 * Exhaustive, no-stringification error logging - every catch block in
 * the runtime/AI layers that logs a caught error should call this
 * instead of hand-rolling `console.error(...)` with a template literal
 * (the exact pattern that caused the `[object Object]` bug: interpolating
 * `error` into a template string implicitly calls `String(error)`).
 * Logs the raw error object (Node's `console.error` uses `util.inspect`
 * on non-first arguments, so this alone already prints real structure,
 * not `.toString()`), its stack (when it's a real `Error`), its `.cause`
 * (when set - see `retry.ts`'s `withRetry`, which now attaches the
 * original pre-wrapped error as `.cause` via the standard `Error`
 * `cause` option), and a full `util.inspect` dump as a final catch-all
 * for plain objects / non-Error throwables that have neither a stack
 * nor a cause.
 */
export function logErrorFully(label: string, error: unknown): void {
  console.error(`${label}:`, error);
  console.error(`${label} stack:`, error instanceof Error ? error.stack : undefined);
  console.error(`${label} cause:`, error instanceof Error ? error.cause : undefined);
  console.error(`${label} inspect:`, inspect(error, { depth: null }));
}

export class RuntimeError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
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
    // Bug fix: was `cause instanceof Error ? cause.message : String(cause)` -
    // `String()` on a non-Error `cause` (a Supabase error object, a plain
    // `throw { ... }`) always produces the literal "[object Object]".
    // `describeError()` extracts the real message instead - see that
    // function's doc comment.
    super(`Job "${jobType}" failed after ${attempts} attempt(s): ${describeError(cause)}`, { cause });
    this.name = "RuntimeJobError";
    this.jobType = jobType;
    this.attempts = attempts;
    this.cause = cause;
  }
}
