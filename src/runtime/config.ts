/**
 * Runtime/automation configuration, resolved from environment variables.
 *
 * Deliberately self-contained (not merged into `src/lib/env.ts`) so
 * every runtime-related concern lives under this one folder ("Runtime
 * ile ilgili tüm kodlar tek klasörde toplansın") - the same isolation
 * principle already used to keep the news and AI verticals independent
 * of each other.
 *
 * Every value has a safe fallback and nothing in this file throws: an
 * invalid or missing env var is logged with `console.warn` and the
 * fallback is used instead, so a bad `.env` value can never crash the
 * app ("Geçersiz environment değerleri uygulamayı asla çökertmemeli").
 */

export type RuntimeConfig = {
  /** Master switch. Defaults to `false` - the runtime never auto-starts just because this module was imported (see `runtime/engine.ts`). */
  enabled: boolean;
  intervals: {
    /** How often the full, database-persisting pipeline (`news-fetch`) runs when the in-process scheduler is used - the interval that actually matters for keeping the live site's real content fresh. See `scheduler/schedule-definitions.ts`'s doc comment for why this is separate from `rssMs` et al. below. */
    newsFetchMs: number;
    rssMs: number;
    newsApiMs: number;
    gNewsMs: number;
    hnMs: number;
    aiMs: number;
    cacheMs: number;
    healthMs: number;
  };
  jobTimeoutMs: number;
  maxRetry: number;
  concurrency: number;
  /**
   * Shared secret an external cron trigger must present (as
   * `Authorization: Bearer <secret>`) to invoke `/api/cron/news-fetch`
   * (see that route). `undefined` when unset - the route treats that as
   * "not configured" and refuses every request (fails closed, never
   * silently open), the same convention `SUPABASE_SERVICE_ROLE_KEY`'s
   * absence already follows elsewhere in this file.
   */
  cronSecret: string | undefined;
};

const MINUTE_MS = 60_000;

function resolveBoolean(key: string, value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  console.warn(`[runtime/config] Unrecognized boolean for "${key}" ("${value}") - falling back to ${fallback}.`);
  return fallback;
}

function resolvePositiveInt(key: string, value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(`[runtime/config] Invalid value for "${key}" ("${value}") - falling back to ${fallback}.`);
    return fallback;
  }
  return Math.floor(parsed);
}

/** Interval env vars are specified in minutes (matching the user's own examples, e.g. "RSS her 5 dakika"); converted to ms once here so every consumer works in ms like the rest of the codebase (`TTLCache`, `AICache`, ...). */
function resolveMinutesToMs(key: string, value: string | undefined, fallbackMinutes: number): number {
  return resolvePositiveInt(key, value, fallbackMinutes) * MINUTE_MS;
}

export function resolveRuntimeConfig(): RuntimeConfig {
  return {
    enabled: resolveBoolean("RUNTIME_ENABLED", process.env.RUNTIME_ENABLED, false),
    intervals: {
      newsFetchMs: resolveMinutesToMs("NEWSFETCH_INTERVAL", process.env.NEWSFETCH_INTERVAL, 30),
      rssMs: resolveMinutesToMs("RSS_INTERVAL", process.env.RSS_INTERVAL, 5),
      newsApiMs: resolveMinutesToMs("NEWSAPI_INTERVAL", process.env.NEWSAPI_INTERVAL, 10),
      gNewsMs: resolveMinutesToMs("GNEWS_INTERVAL", process.env.GNEWS_INTERVAL, 10),
      /** Hacker News needs no API key, so its default interval mirrors RSS's (5min) rather than the key-gated NewsAPI/GNews's 10min. */
      hnMs: resolveMinutesToMs("HN_INTERVAL", process.env.HN_INTERVAL, 5),
      aiMs: resolveMinutesToMs("AI_INTERVAL", process.env.AI_INTERVAL, 15),
      cacheMs: resolveMinutesToMs("CACHE_INTERVAL", process.env.CACHE_INTERVAL, 5),
      healthMs: resolveMinutesToMs("HEALTH_INTERVAL", process.env.HEALTH_INTERVAL, 1),
    },
    jobTimeoutMs: resolvePositiveInt("JOB_TIMEOUT", process.env.JOB_TIMEOUT, 30_000),
    maxRetry: resolvePositiveInt("MAX_RETRY", process.env.MAX_RETRY, 3),
    concurrency: resolvePositiveInt("CONCURRENCY", process.env.CONCURRENCY, 2),
    cronSecret: process.env.CRON_SECRET && process.env.CRON_SECRET.trim() !== "" ? process.env.CRON_SECRET : undefined,
  };
}

/** Default, ready-to-use config instance - import this, not `resolveRuntimeConfig` directly, from anywhere in `runtime/*` (mirrors `lib/env.ts`'s `env` singleton). */
export const runtimeConfig: RuntimeConfig = resolveRuntimeConfig();
