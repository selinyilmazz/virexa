import { runtimeConfig } from "@/runtime/config";
import type { JobType } from "@/runtime/types";

export type ScheduleDefinition = {
  jobType: JobType;
  /**
   * Human-readable cron expression - documentation only today. Actual
   * scheduling (see `scheduler.ts`) uses `setInterval` at `intervalMs`,
   * an intentional stand-in for a real external cron trigger (GitHub
   * Actions, Vercel Cron, Supabase Edge Functions) - swapping the
   * trigger mechanism later means changing `scheduler.ts` alone, no job
   * code changes, since every job is already independently invocable
   * via `runtimeEngine.runJob(jobType)`.
   */
  cron: string;
  intervalMs: number;
};

/**
 * One entry per job type that should run on a recurring cadence,
 * matching the user's own examples (RSS every 5 min, NewsAPI every 10
 * min, AI every 15 min, Cleanup once a day, Health Check every 1 min).
 * `hn-sync` was added alongside the Hacker News integration, scheduled
 * every 5 min like `rss-sync` (both need no API key, unlike the
 * 10-minute NewsAPI/GNews).
 *
 * IMPORTANT, found during the "Scheduler Stopped / no new articles"
 * production incident: `rss-sync`, `newsapi-sync`, `gnews-sync`, and
 * `hn-sync` each only touch the legacy in-memory `live-articles` cache
 * (`services/news/live-articles.ts`) - NONE of them write to Supabase.
 * Only `news-fetch` runs the full ingestion pipeline INCLUDING the
 * database step (`pipeline/steps/database-step.ts`), which is what every
 * current, database-backed page (`article-read-service.ts`) actually
 * reads from. A perfectly running scheduler with only the per-provider
 * jobs below would still never have put a single new article on the live
 * site - `news-fetch` itself was missing from this list entirely. It's
 * now included, and is the one entry that matters for keeping the live
 * site fresh.
 *
 * All 9 AI jobs (`ai-summary`, `ai-tldr`, `ai-key-takeaways`,
 * `ai-long-summary`, `ai-rewrite`, `ai-entities`, `ai-tag`, `sentiment`,
 * `bias-analysis`) DO write to Supabase now (production architecture fix -
 * see `runtime/jobs/ai-jobs.ts`'s doc comment): each is independent,
 * self-selects a small batch of already-persisted articles still missing
 * its field, and runs entirely decoupled from `news-fetch`.
 *
 * `news-fetch` is deliberately NOT a replacement for the granular
 * per-provider jobs above - those still have standalone value for
 * observability/debugging one provider in isolation - but this codebase
 * has no instrumentation.ts wiring that ever calls `runtimeEngine.start()`
 * for ANY of these, and on serverless hosting (Vercel) this whole
 * `setInterval`-based scheduler doesn't persist between invocations
 * regardless. The real production trigger is the external one at
 * `/api/cron/news-fetch` + `/api/cron/ai-enrichment` (see those routes +
 * `vercel.json`) - this in-process schedule only actually runs anything
 * for a deployment that both sets `RUNTIME_ENABLED=true` AND has
 * something call `runtimeEngine.start()` on a long-lived, persistent Node
 * process (e.g. self-hosted/Docker, not Vercel).
 *
 * `duplicate-detection` and `trending` are still intentionally NOT
 * auto-scheduled - `news-fetch` already runs both internally on every
 * pass, and `trending`'s own standalone job only recomputes scores for
 * whatever's already in the (now largely redundant) live-articles cache.
 */
export const SCHEDULE_DEFINITIONS: ScheduleDefinition[] = [
  { jobType: "news-fetch", cron: "*/30 * * * *", intervalMs: runtimeConfig.intervals.newsFetchMs },
  { jobType: "rss-sync", cron: "*/5 * * * *", intervalMs: runtimeConfig.intervals.rssMs },
  { jobType: "newsapi-sync", cron: "*/10 * * * *", intervalMs: runtimeConfig.intervals.newsApiMs },
  { jobType: "gnews-sync", cron: "*/10 * * * *", intervalMs: runtimeConfig.intervals.gNewsMs },
  { jobType: "hn-sync", cron: "*/5 * * * *", intervalMs: runtimeConfig.intervals.hnMs },
  { jobType: "ai-summary", cron: "*/15 * * * *", intervalMs: runtimeConfig.intervals.aiMs },
  { jobType: "ai-tldr", cron: "*/15 * * * *", intervalMs: runtimeConfig.intervals.aiMs },
  { jobType: "ai-key-takeaways", cron: "*/15 * * * *", intervalMs: runtimeConfig.intervals.aiMs },
  { jobType: "ai-long-summary", cron: "*/15 * * * *", intervalMs: runtimeConfig.intervals.aiMs },
  { jobType: "ai-rewrite", cron: "*/15 * * * *", intervalMs: runtimeConfig.intervals.aiMs },
  { jobType: "ai-entities", cron: "*/15 * * * *", intervalMs: runtimeConfig.intervals.aiMs },
  { jobType: "ai-tag", cron: "*/15 * * * *", intervalMs: runtimeConfig.intervals.aiMs },
  { jobType: "sentiment", cron: "*/15 * * * *", intervalMs: runtimeConfig.intervals.aiMs },
  { jobType: "bias-analysis", cron: "*/15 * * * *", intervalMs: runtimeConfig.intervals.aiMs },
  { jobType: "cache-refresh", cron: "*/5 * * * *", intervalMs: runtimeConfig.intervals.cacheMs },
  { jobType: "cleanup", cron: "0 3 * * *", intervalMs: 24 * 60 * 60 * 1000 },
  { jobType: "health-check", cron: "* * * * *", intervalMs: runtimeConfig.intervals.healthMs },
];
