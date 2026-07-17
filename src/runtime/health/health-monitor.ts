import { env } from "@/lib/env";
import { FEED_SOURCES, fetchWithTimeout } from "@/lib/news";
import { createArticleRepository } from "@/repositories/article-repository";
import { createServiceClient } from "@/lib/supabase/service-client";
import type { QueueJobStatus } from "@/runtime/queue/runtime-queue";
import { aiCache, aiService } from "@/services/ai";
import { getLiveArticlesCacheStatus } from "@/services/news";

/**
 * System health monitoring - checks RSS access, NewsAPI, GNews, Hacker
 * News, AI Provider, Database, Cache, and Queue ("RSS erişimi, NewsAPI,
 * GNews, AI Provider, Database, Cache, Queue kontrol edilmeli"; Hacker
 * News added alongside that integration, mirroring the RSS check since
 * both are free/public APIs worth a real reachability ping rather than
 * just a configuration-presence check).
 *
 * Every check function below returns a result, never throws - a
 * provider being unreachable is a normal, reportable outcome
 * ("statusun `down` olması), not a crash. `checkSystemHealth()` runs
 * every check in parallel and combines them into one report, so one
 * slow/unreachable check can never block the others from completing
 * ("Bir provider'a ulaşılamazsa sistem çalışmaya devam etmeli").
 */

export type HealthCheckId = "rss" | "newsapi" | "gnews" | "hn" | "ai-provider" | "database" | "cache" | "queue";
export type HealthStatus = "ok" | "degraded" | "down" | "unconfigured";

export type HealthCheckResult = {
  id: HealthCheckId;
  status: HealthStatus;
  message: string;
  checkedAt: string;
  durationMs: number;
};

export type HealthReport = {
  overall: HealthStatus;
  checks: HealthCheckResult[];
  checkedAt: string;
};

const NETWORK_CHECK_TIMEOUT_MS = 5000;

async function timed(
  id: HealthCheckId,
  fn: () => Promise<{ status: HealthStatus; message: string }>
): Promise<HealthCheckResult> {
  const startedAt = Date.now();
  try {
    const { status, message } = await fn();
    return { id, status, message, checkedAt: new Date().toISOString(), durationMs: Date.now() - startedAt };
  } catch (error) {
    return {
      id,
      status: "down",
      message: error instanceof Error ? error.message : String(error),
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
    };
  }
}

/** Real, lightweight network check: fetches the first enabled RSS feed (`lib/news/feed-sources.ts`) with a short timeout. Free/public, so - unlike NewsAPI/GNews below - actually calling it on every health tick is safe. */
export async function checkRssHealth(): Promise<HealthCheckResult> {
  return timed("rss", async () => {
    const feed = FEED_SOURCES.find((entry) => entry.enabled);
    if (!feed) {
      return { status: "unconfigured", message: "No RSS feed is enabled in feed-sources.ts." };
    }

    const response = await fetchWithTimeout(feed.url, { method: "GET" }, NETWORK_CHECK_TIMEOUT_MS);
    return response.ok
      ? { status: "ok", message: `Reached "${feed.label}" (HTTP ${response.status}).` }
      : { status: "degraded", message: `"${feed.label}" responded with HTTP ${response.status}.` };
  });
}

/** Configuration-presence check only, by design: NewsAPI has a paid rate limit, and the default `HEALTH_INTERVAL` is once a minute - live-pinging it would burn quota fast for no real benefit. */
export async function checkNewsApiHealth(): Promise<HealthCheckResult> {
  return timed("newsapi", async () =>
    env.news.newsApiKey
      ? { status: "ok", message: "NEWS_API_KEY is configured." }
      : { status: "unconfigured", message: "NEWS_API_KEY is not set - NewsAPIProvider safely no-ops." }
  );
}

/** Same reasoning as NewsAPI above. */
export async function checkGNewsHealth(): Promise<HealthCheckResult> {
  return timed("gnews", async () =>
    env.news.gNewsApiKey
      ? { status: "ok", message: "GNEWS_API_KEY is configured." }
      : { status: "unconfigured", message: "GNEWS_API_KEY is not set - GNewsProvider safely no-ops." }
  );
}

/** Real, lightweight network check against the Hacker News Firebase API's cheapest endpoint (`maxitem.json` - a single integer, not a listing) - mirrors `checkRssHealth`'s "actually ping it, it's free" reasoning, since `HackerNewsProvider` needs no API key and is never "unconfigured". */
export async function checkHnHealth(): Promise<HealthCheckResult> {
  return timed("hn", async () => {
    const response = await fetchWithTimeout(
      "https://hacker-news.firebaseio.com/v0/maxitem.json",
      { method: "GET" },
      NETWORK_CHECK_TIMEOUT_MS
    );
    return response.ok
      ? { status: "ok", message: `Hacker News API reachable (HTTP ${response.status}).` }
      : { status: "degraded", message: `Hacker News API responded with HTTP ${response.status}.` };
  });
}

/** Configuration-presence check only, same reasoning - `aiService.isConfigured` mirrors whether `AI_PROVIDER`'s API key is set (see `services/ai/ai-provider-instance.ts`). */
export async function checkAiProviderHealth(): Promise<HealthCheckResult> {
  return timed("ai-provider", async () =>
    aiService.isConfigured
      ? { status: "ok", message: `AI provider "${env.ai.provider}" is configured.` }
      : { status: "unconfigured", message: `No API key set for AI_PROVIDER="${env.ai.provider}" - AI features safely no-op.` }
  );
}

/**
 * Real database health check - queries `articles` through the same
 * Repository Pattern the rest of the app uses (`ArticleRepository.count()`,
 * a zero-row `head` request), via the service-role client (works in
 * both request and background-job contexts, unlike the request-scoped
 * client). `articles`/`article_sources` are publicly readable (see
 * `0002_article_storage.sql`'s RLS), so this is a safe, meaningful
 * check - not a write, not touching any per-user table.
 *
 * Replaces a prior version that pinged Supabase's `/auth/v1/health`
 * endpoint with no `apikey` header - Supabase's gateway rejects any
 * request missing that header with HTTP 401 before it ever reaches
 * Postgres or Auth, so that check always reported "degraded" (HTTP 401)
 * regardless of whether the actual database was healthy, and never
 * reflected whether `articles` was really reachable.
 */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  return timed("database", async () => {
    if (!env.supabase.url) {
      return { status: "unconfigured", message: "SUPABASE_URL is not set." };
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return { status: "unconfigured", message: "SUPABASE_SERVICE_ROLE_KEY is not set." };
    }

    const total = await createArticleRepository(supabase).count();
    return { status: "ok", message: `Database reachable - ${total} article(s) in "articles".` };
  });
}

/** Reports on both caches the runtime cares about: the live-articles `TTLCache` (`services/news/live-articles.ts`) and the AI result `AICache` (`services/ai/ai-service-instance.ts`) - an empty live-articles cache is flagged `degraded` (nothing to serve yet), staleness alone is not, since stale-while-revalidate already handles that transparently. */
export async function checkCacheHealth(): Promise<HealthCheckResult> {
  return timed("cache", async () => {
    const live = getLiveArticlesCacheStatus();
    if (live.size === 0) {
      return { status: "degraded", message: "live-articles cache is empty - no successful fetch yet." };
    }
    const freshness = live.isStale ? "stale (a background refresh will trigger on next read)" : "fresh";
    return {
      status: "ok",
      message: `live-articles: ${live.size} article(s), ${freshness}. AI cache: ${aiCache.size} entr${aiCache.size === 1 ? "y" : "ies"}.`,
    };
  });
}

/** Takes queue stats as a parameter rather than importing a singleton `RuntimeQueue` directly, so this module has no hard dependency on `runtime/engine.ts`'s specific instance - the engine passes its own queue's `getStats()` in when it calls `checkSystemHealth()`. */
export async function checkQueueHealth(stats: Record<QueueJobStatus, number>): Promise<HealthCheckResult> {
  return timed("queue", async () => {
    if (stats.failed > 0 && stats.completed === 0 && stats.running === 0) {
      return { status: "degraded", message: `Queue has ${stats.failed} failed job(s) and nothing else in flight yet.` };
    }
    return {
      status: "ok",
      message: `queued=${stats.queued} delayed=${stats.delayed} running=${stats.running} completed=${stats.completed} failed=${stats.failed} cancelled=${stats.cancelled}`,
    };
  });
}

function overallFrom(checks: HealthCheckResult[]): HealthStatus {
  if (checks.some((check) => check.status === "down")) return "down";
  if (checks.some((check) => check.status === "degraded")) return "degraded";
  // "unconfigured" checks (e.g. no NewsAPI key yet) don't degrade overall health - that's a normal, safe state for this app.
  return "ok";
}

/**
 * Runs every check in parallel and combines them into one report. Never
 * throws - each individual check already catches its own errors
 * (`timed()` above) and reports `"down"` instead of rejecting, so one
 * unreachable provider can never stop the rest of the system from being
 * checked, or from continuing to run.
 */
export async function checkSystemHealth(getQueueStats: () => Record<QueueJobStatus, number>): Promise<HealthReport> {
  const checks = await Promise.all([
    checkRssHealth(),
    checkNewsApiHealth(),
    checkGNewsHealth(),
    checkHnHealth(),
    checkAiProviderHealth(),
    checkDatabaseHealth(),
    checkCacheHealth(),
    checkQueueHealth(getQueueStats()),
  ]);

  return { overall: overallFrom(checks), checks, checkedAt: new Date().toISOString() };
}
