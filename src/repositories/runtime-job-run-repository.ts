import type { SupabaseClient } from "@supabase/supabase-js";
import { runtimeJobRunInputSchema, runtimeJobRunListParamsSchema } from "@/lib/validation/runtime-job-run-schema";
import type { RuntimeJobRunInput, RuntimeJobRunListParams } from "@/lib/validation/runtime-job-run-schema";
import type { Database, RuntimeJobRunInsert, RuntimeJobRunRow } from "@/types/database";

function toInsert(input: RuntimeJobRunInput): RuntimeJobRunInsert {
  return {
    job_type: input.jobType,
    status: input.status,
    started_at: input.startedAt ?? null,
    finished_at: input.finishedAt,
    duration_ms: input.durationMs ?? null,
    attempts: input.attempts,
    error: input.error ?? null,
  };
}

/**
 * Data access for the `runtime_job_runs` table (see
 * `supabase/migrations/0006_runtime_job_runs.sql`). Only ever called
 * with a service-role client - the table has RLS enabled with no
 * policies, so a request-scoped client could never read or write it
 * anyway (same convention as `audit-log-repository.ts`).
 */
export function createRuntimeJobRunRepository(supabase: SupabaseClient<Database>) {
  return {
    /** Appends one finished-job record. Never updates/deletes - this table is append-only history, same as `admin_audit_log`. */
    async record(rawInput: RuntimeJobRunInput): Promise<void> {
      const input = runtimeJobRunInputSchema.parse(rawInput);
      const { error } = await supabase.from("runtime_job_runs").insert(toInsert(input));
      if (error) throw error;
    },

    /** Most recent runs, newest-first by `finished_at`, optionally filtered to one status - powers the Admin Dashboard's Last Run/Last Success/Last Error cards (`RuntimeStatusSection.tsx`) across process restarts, unlike the in-memory `RuntimeQueue` history alone. */
    async listRecent(rawParams: Partial<RuntimeJobRunListParams> = {}): Promise<RuntimeJobRunRow[]> {
      const params = runtimeJobRunListParamsSchema.parse(rawParams);

      let query = supabase.from("runtime_job_runs").select("*");
      if (params.status) query = query.eq("status", params.status);

      const { data, error } = await query.order("finished_at", { ascending: false }).limit(params.limit);
      if (error) throw error;

      return data ?? [];
    },

    /**
     * Counts of finished runs by status since `sinceIso`, across every job
     * type - the DB-backed replacement for `RuntimeStatusSection`'s old
     * "Queue" card, which used to read `runtimeEngine.queue.getStats()`
     * (an in-memory `Map`, meaningless on serverless - see that
     * component's doc comment for the full explanation). Only
     * `completed`/`failed`/`cancelled` are countable this way (this table
     * is only ever written once a job SETTLES - see `record()`'s doc
     * comment - so "queued"/"running" have no durable representation at
     * all, unlike the in-memory queue's transient state).
     *
     * No server-side `GROUP BY` through the shimmed query builder, same
     * tradeoff as `article-ai-repository.ts`'s `listAllLatestPerArticle` -
     * fetches just the `status` column for the window and reduces in
     * application code. Bounded by `sinceIso`, not a `limit`, so this
     * stays cheap regardless of table size as long as the window is
     * reasonable (the Dashboard uses 24h).
     */
    async countRecentByStatus(sinceIso: string): Promise<Record<string, number>> {
      const { data, error } = await supabase.from("runtime_job_runs").select("status").gte("finished_at", sinceIso);
      if (error) throw error;

      const counts: Record<string, number> = { completed: 0, failed: 0, cancelled: 0 };
      for (const row of data ?? []) {
        counts[row.status] = (counts[row.status] ?? 0) + 1;
      }
      return counts;
    },
  };
}

export type RuntimeJobRunRepository = ReturnType<typeof createRuntimeJobRunRepository>;
