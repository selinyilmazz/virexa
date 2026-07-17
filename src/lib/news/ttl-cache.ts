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
 * `get` / `set` / `getOrSet` / `getStaleWhileRevalidate`.
 */
export class TTLCache<V> {
  private value: V | undefined;
  private expiresAt = 0;
  private isRefreshing = false;

  constructor(private readonly ttlMs: number) {}

  /** Returns the cached value, or `undefined` if empty or expired. */
  get(): V | undefined {
    if (this.value === undefined || Date.now() >= this.expiresAt) {
      return undefined;
    }
    return this.value;
  }

  /** Returns the last-good value regardless of TTL expiry, or `undefined` before the first `set()`. */
  peek(): V | undefined {
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
   * refresh is in flight are the caller's responsibility to dedupe.
   * Blocks (awaits `factory`) on a cold cache - use
   * `getStaleWhileRevalidate` instead when the caller must never block.
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

  /**
   * Stale-while-revalidate read for callers that must never block or
   * throw (e.g. a synchronous UI data path). Always returns the
   * last-good value immediately, regardless of whether its TTL has
   * expired; if it's stale and no refresh is already in flight, kicks
   * off a background `factory()` call that updates the cache for next
   * time. A failed refresh is reported via `onError` (for logging) and
   * simply leaves the previous value in place - this is what lets a
   * provider outage keep serving the last successful result instead of
   * surfacing an error to the UI. Returns `undefined` only before the
   * very first successful `set()`/refresh has ever completed.
   */
  getStaleWhileRevalidate(factory: () => Promise<V>, onError?: (error: unknown) => void, onSuccess?: (value: V) => void): V | undefined {
    if (this.isStale && !this.isRefreshing) {
      this.isRefreshing = true;
      factory()
        .then((value) => {
          this.set(value);
          onSuccess?.(value);
        })
        .catch((error) => {
          onError?.(error);
        })
        .finally(() => {
          this.isRefreshing = false;
        });
    }
    return this.peek();
  }
}
