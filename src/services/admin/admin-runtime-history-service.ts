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

export type RuntimeJobHistory = {
  lastRun: RuntimeJobRunRow | null;
  lastSuccess: RuntimeJobRunRow | null;
  lastFailure: RuntimeJobRunRow | null;
};

function emptyHistory(): RuntimeJobHistory {
  return { lastRun: null, lastSuccess: null, lastFailure: null };
}

/** Most recent run overall, most recent completed run, and most recent failed run - each independently queried (`runtimeJobRunRepository.listRecent`) since "most recent run" and "most recent success" are not the same row whenever the latest run failed. */
export async function getRuntimeJobHistory(): Promise<RuntimeJobHistory> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return emptyHistory();

    const runtimeJobRunRepository = createRuntimeJobRunRepository(supabase);
    const [lastRunPage, lastSuccessPage, lastFailurePage] = await Promise.all([
      runtimeJobRunRepository.listRecent({ limit: 1 }),
      runtimeJobRunRepository.listRecent({ limit: 1, status: "completed" }),
      runtimeJobRunRepository.listRecent({ limit: 1, status: "failed" }),
    ]);

    return {
      lastRun: lastRunPage[0] ?? null,
      lastSuccess: lastSuccessPage[0] ?? null,
      lastFailure: lastFailurePage[0] ?? null,
    };
  } catch (error) {
    console.error("[admin-runtime-history-service] getRuntimeJobHistory failed:", error);
    return emptyHistory();
  }
}
