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
  };
}

export type RuntimeJobRunRepository = ReturnType<typeof createRuntimeJobRunRepository>;
