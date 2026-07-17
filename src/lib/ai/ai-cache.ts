/**
 * Hash-based, TTL, multi-key cache for AI task results.
 *
 * One `AICache` instance backs every AI task (summary, TL;DR, tags,
 * sentiment, bias, ...) - each task's result is stored under its own
 * key via `buildCacheKey`, which folds in the task name, article id,
 * content hash, provider id, and prompt version. That composite key is
 * what makes cache invalidation automatic rather than something this
 * class has to actively manage:
 *  - a different `contentHash` (article edited) -> different key -> old
 *    entry is simply never read again ("Hash değişmedikçe cache
 *    kullanılsın").
 *  - a different `providerId` (env `AI_PROVIDER` changed) -> different
 *    key -> the new provider never accidentally serves the old
 *    provider's cached output ("Provider değişirse cache otomatik
 *    geçersiz olsun").
 *  - a different prompt `version` (a `*.prompt.ts` file's wording
 *    changed) -> same idea.
 *
 * Process-local (a plain `Map`), same tradeoff as `lib/news/ttl-cache.ts`:
 * no cross-instance coherency yet, zero dependency footprint. Swap for a
 * shared store (Redis, a DB table) later without changing callers - the
 * public API is just `get` / `set` / `clear`.
 */

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

export function buildCacheKey(
  task: string,
  articleId: string,
  contentHash: string,
  providerId: string,
  version: string
): string {
  return `${task}:${articleId}:${contentHash}:${providerId}:${version}`;
}

export class AICache {
  private readonly store = new Map<string, CacheEntry>();

  constructor(private readonly ttlMs: number) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /** Drops every cached entry - not required for normal operation (see class doc), but useful for tests/ops. */
  clear(): void {
    this.store.clear();
  }

  /**
   * Removes every entry whose TTL has already elapsed and returns how
   * many were removed. Entries also self-expire lazily on `get()`, so
   * this isn't required for correctness - it's a proactive housekeeping
   * pass for a long-lived process, called by the runtime layer's
   * `CleanupJob` (see `runtime/jobs/system-jobs.ts`).
   */
  pruneExpired(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.store) {
      if (now >= entry.expiresAt) {
        this.store.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  get size(): number {
    return this.store.size;
  }
}
