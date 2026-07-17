/**
 * A minimal in-memory time-to-live cache. Used to avoid re-fetching RSS
 * feeds (or hitting any other provider) on every single request — a
 * value is reused until `ttlMs` elapses, after which the next read
 * triggers a fresh fetch.
 *
 * Intentionally process-local (no external store): the pipeline doesn't
 * need cross-instance cache coherency yet, and this keeps the dependency
 * footprint at zero. Swap for a shared cache (e.g. backed by Supabase or
 * Redis) later without changing callers, since the public API is just
 * `get` / `set` / `getOrSet`.
 */
export class TTLCache<V> {
  private value: V | undefined;
  private expiresAt = 0;

  constructor(private readonly ttlMs: number) {}

  /** Returns the cached value, or `undefined` if empty or expired. */
  get(): V | undefined {
    if (this.value === undefined || Date.now() >= this.expiresAt) {
      return undefined;
    }
    return this.value;
  }

  set(value: V): void {
    this.value = value;
    this.expiresAt = Date.now() + this.ttlMs;
  }

  get isStale(): boolean {
    return this.value === undefined || Date.now() >= this.expiresAt;
  }

  /**
   * Returns the cached value if still fresh; otherwise calls `factory`,
   * caches its result, and returns that. Concurrent calls while a
   * refresh is in flight are the caller's responsibility to dedupe (see
   * `services/news/live-articles.ts` for the pattern used against RSS).
   */
  async getOrSet(factory: () => Promise<V>): Promise<V> {
    const cached = this.get();
    if (cached !== undefined) {
      return cached;
    }
    const fresh = await factory();
    this.set(fresh);
    return fresh;
  }
}
