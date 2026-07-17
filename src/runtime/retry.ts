import { RuntimeCancelledError, RuntimeTimeoutError } from "@/runtime/errors";
import type { CancelToken } from "@/runtime/types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Races `promise` against a timeout, rejecting with `RuntimeTimeoutError`
 * if `timeoutMs` elapses first. This does not (cannot) actually abort
 * in-flight work - see the `CancelToken` doc in `runtime/types.ts` on
 * cooperative cancellation - it just stops the caller from waiting any
 * longer for it.
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new RuntimeTimeoutError(label, timeoutMs)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export type RetryOptions = {
  maxAttempts: number;
  backoffMs: number;
  timeoutMs: number;
  cancelToken?: CancelToken;
  onRetry?: (attempt: number, error: unknown) => void;
};

/**
 * Runs `fn` with retry (linear backoff, matching the existing
 * `lib/ai/ai-queue.ts` convention so the codebase has one retry "feel"),
 * a per-attempt timeout, and cooperative cancellation. Throws the last
 * error once `maxAttempts` is exhausted, or immediately throws
 * `RuntimeCancelledError` if `cancelToken` is already cancelled before
 * an attempt starts. Callers (job wrappers in `runtime/jobs/*`) are
 * expected to let this throw - the queue is what catches it and keeps
 * the rest of the system running ("Bir job'un başarısız olması tüm
 * sistemi durdurmamalı").
 */
export async function withRetry<T>(label: string, fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { maxAttempts, backoffMs, timeoutMs, cancelToken, onRetry } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (cancelToken?.isCancelled) {
      throw new RuntimeCancelledError(label);
    }

    try {
      return await withTimeout(fn(), timeoutMs, label);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) break;
      onRetry?.(attempt, error);
      await sleep(backoffMs * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
