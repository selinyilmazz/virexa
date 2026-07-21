import { createServiceClient } from "@/lib/supabase/service-client";
import { createRuntimeJobRunRepository } from "@/repositories/runtime-job-run-repository";
import type { RuntimeJobRunRow } from "@/types/database";

/**
 * Durable runtime job history, backing `RuntimeStatusSection`'s "Last
 * Run/Last Success/Last Error" cards ("Runtime Status ... Memory yerine
 * production uyumlu bir çözüm tasarla"). Reads `runtime_job_runs`
 * (`supabase/migrations/0006_runtime_job_runs.sql`), populated by
 * `runtime/engine.ts`'s `persistRuntimeJobRun()` hook every time a job
 * settles - independent of `RuntimeQueue`'s own in-memory entry `Map`,
 * so these numbers survive process restarts and are consistent across
 * serverless instances.
 *
 * Same conventions as `admin-audit-service.ts` (the closest existing
 * analog: also a service-role-only table with no RLS policies): always
 * uses the service-role client, never throws - a history read failing
 * must never break the Dashboard, it should just fall back to "no data
 * yet" the same way it already did before this table existed.
 */

/** How far back `recentByStatus` looks - matches `news-fetch`'s own daily cron cadence (`vercel.json`: `0 6 * * *`) with margin, so a healthy production deployment always has at least one row in this window. */
const RECENT_ACTIVITY_WINDOW_HOURS = 26;

export type RuntimeJobHistory = {
  lastRun: RuntimeJobRunRow | null;
  lastSuccess: RuntimeJobRunRow | null;
  lastFailure: RuntimeJobRunRow | null;
  /** Completed/failed/cancelled counts over the last `RECENT_ACTIVITY_WINDOW_HOURS` hours, across every job type - see `runtime-job-run-repository.ts`'s `countRecentByStatus` doc for why this replaced the old in-memory queue-stats card. */
  recentByStatus: Record<string, number>;
};

function emptyHistory(): RuntimeJobHistory {
  return { lastRun: null, lastSuccess: null, lastFailure: null, recentByStatus: { completed: 0, failed: 0, cancelled: 0 } };
}

/**
 * Most recent run overall, most recent completed run, most recent failed
 * run, and a recent-activity breakdown - all DB-backed
 * (`runtime_job_runs`, written by `RuntimeQueue`'s `onEntryFinished` hook
 * every time a job settles), NOT `runtimeEngine`'s in-memory state.
 *
 * This distinction matters specifically on serverless (Vercel): each
 * request - including the Admin Dashboard's own page render - gets its
 * own process/execution context, so anything read from
 * `runtimeEngine.queue`/`runtimeEngine.isRunning` directly reflects only
 * THAT request's own (always-empty) in-memory state, never what actually
 * happened when `/api/cron/news-fetch` or `/api/cron/ai-enrichment` ran
 * in a completely different invocation. This function is the one
 * `RuntimeStatusSection.tsx` should read for anything that needs to
 * survive across requests - "most recent run" and "most recent success"
 * are not the same row whenever the latest run failed, so each is
 * queried independently (`runtimeJobRunRepository.listRecent`).
 */
export async function getRuntimeJobHistory(): Promise<RuntimeJobHistory> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return emptyHistory();

    const runtimeJobRunRepository = createRuntimeJobRunRepository(supabase);
    const since = new Date(Date.now() - RECENT_ACTIVITY_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

    const [lastRunPage, lastSuccessPage, lastFailurePage, recentByStatus] = await Promise.all([
      runtimeJobRunRepository.listRecent({ limit: 1 }),
      runtimeJobRunRepository.listRecent({ limit: 1, status: "completed" }),
      runtimeJobRunRepository.listRecent({ limit: 1, status: "failed" }),
      runtimeJobRunRepository.countRecentByStatus(since),
    ]);

    return {
      lastRun: lastRunPage[0] ?? null,
      lastSuccess: lastSuccessPage[0] ?? null,
      lastFailure: lastFailurePage[0] ?? null,
      recentByStatus,
    };
  } catch (error) {
    console.error("[admin-runtime-history-service] getRuntimeJobHistory failed:", error);
    return emptyHistory();
  }
}

/** Whether production automation looks alive right now - "cron çalıştığında Dashboard gerçek zamanı göstersin, Scheduler Stopped yazısı yanıltıcı olmasın" - based on real evidence (a `runtime_job_runs` row from ANY job type within the recent-activity window), not `runtimeEngine.isRunning` (which is always `false` on serverless by design - see `runtime/scheduler/schedule-definitions.ts` - and was never a meaningful signal for whether production is actually working). */
export function isRuntimeRecentlyActive(history: RuntimeJobHistory): boolean {
  if (!history.lastRun?.finished_at) return false;
  const ageMs = Date.now() - new Date(history.lastRun.finished_at).getTime();
  return ageMs <= RECENT_ACTIVITY_WINDOW_HOURS * 60 * 60 * 1000;
}
