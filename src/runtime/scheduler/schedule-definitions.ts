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
 * 10-minute NewsAPI/GNews). `news-fetch` (the full end-to-end
 * pipeline), `duplicate-detection`, and `trending` are intentionally
 * NOT auto-scheduled here - they're still fully independent jobs,
 * runnable any time via `runtimeEngine.runJob(...)` (manual trigger) or
 * a future addition to this list; auto-running them alongside the
 * already-scheduled rss-sync/newsapi-sync/gnews-sync/hn-sync/ai-* jobs
 * would just duplicate work.
 */
export const SCHEDULE_DEFINITIONS: ScheduleDefinition[] = [
  { jobType: "rss-sync", cron: "*/5 * * * *", intervalMs: runtimeConfig.intervals.rssMs },
  { jobType: "newsapi-sync", cron: "*/10 * * * *", intervalMs: runtimeConfig.intervals.newsApiMs },
  { jobType: "gnews-sync", cron: "*/10 * * * *", intervalMs: runtimeConfig.intervals.gNewsMs },
  { jobType: "hn-sync", cron: "*/5 * * * *", intervalMs: runtimeConfig.intervals.hnMs },
  { jobType: "ai-summary", cron: "*/15 * * * *", intervalMs: runtimeConfig.intervals.aiMs },
  { jobType: "ai-tag", cron: "*/15 * * * *", intervalMs: runtimeConfig.intervals.aiMs },
  { jobType: "sentiment", cron: "*/15 * * * *", intervalMs: runtimeConfig.intervals.aiMs },
  { jobType: "bias-analysis", cron: "*/15 * * * *", intervalMs: runtimeConfig.intervals.aiMs },
  { jobType: "cache-refresh", cron: "*/5 * * * *", intervalMs: runtimeConfig.intervals.cacheMs },
  { jobType: "cleanup", cron: "0 3 * * *", intervalMs: 24 * 60 * 60 * 1000 },
  { jobType: "health-check", cron: "* * * * *", intervalMs: runtimeConfig.intervals.healthMs },
];
