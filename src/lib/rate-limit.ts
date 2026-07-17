/**
 * Minimal in-memory, fixed-window rate limiter (Production Readiness
 * phase, Security Hardening requirement 3). No rate-limiting library or
 * external store (Redis, etc.) exists in this project - see
 * package.json - so this is a small, dependency-free implementation
 * scoped to what's actually needed: protecting the one fully public,
 * unauthenticated write endpoint (`POST /api/metrics`) from trivial
 * spam/abuse (inflating view/bookmark/share counters).
 *
 * KNOWN LIMITATION (documented honestly, not hidden): this state is
 * per server-process, in-memory. On a multi-instance/serverless
 * deployment (e.g. Vercel, which can run multiple concurrent function
 * instances), each instance has its own independent counters, so the
 * effective global limit is `limit * instance count`, not a hard cap.
 * This is still meaningfully better than no limiting at all for
 * single-instance/low-traffic deployments and casual abuse, but it is
 * NOT a substitute for a shared store (Redis/Upstash) if this endpoint
 * ever needs a hard, globally-enforced limit - flagged as a known gap
 * in the production readiness report rather than overstating what this
 * provides.
 *
 * Every admin write route already has a stronger control than rate
 * limiting could add - authentication (`getAdminUserOrNull()`) - so
 * this is intentionally NOT applied there; a signed-in admin hammering
 * their own dashboard is not the threat model this addresses.
 */

type WindowEntry = { count: number; resetAt: number };

const buckets = new Map<string, WindowEntry>();

/** Periodic cleanup so `buckets` doesn't grow unbounded over a long-lived process - runs lazily on each check rather than a separate timer. */
function pruneExpired(now: number) {
  if (buckets.size < 500) return; // Cheap size guard - avoid scanning on every single call.
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * `key` should already encode both the caller (e.g. IP) and the route -
 * see `getClientIdentifier()` below for the caller half.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** Best-effort caller identifier from standard proxy headers (Vercel/most reverse proxies set `x-forwarded-for`). Falls back to a constant so requests without either header still share one bucket instead of bypassing the limit entirely. */
export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
