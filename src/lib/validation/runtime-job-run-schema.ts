import { z } from "zod";

/**
 * Server-side validation for `runtime_job_runs` writes (see
 * `supabase/migrations/0006_runtime_job_runs.sql`). Same convention as
 * `audit-log-schema.ts`: validated before it ever reaches the
 * repository/database. Written once per finished job by `RuntimeQueue`
 * (`runtime/queue/runtime-queue.ts`) via `runtime/engine.ts`'s
 * persistence callback.
 */
export const runtimeJobRunInputSchema = z.object({
  jobType: z.string().trim().min(1, "jobType is required."),
  status: z.enum(["completed", "failed", "cancelled"]),
  startedAt: z.string().trim().min(1).nullable().optional(),
  finishedAt: z.string().trim().min(1, "finishedAt is required."),
  durationMs: z.number().int().nonnegative().nullable().optional(),
  attempts: z.number().int().nonnegative().default(0),
  error: z.string().trim().min(1).nullable().optional(),
});

export type RuntimeJobRunInput = z.infer<typeof runtimeJobRunInputSchema>;

export const runtimeJobRunListParamsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  status: z.enum(["completed", "failed", "cancelled"]).optional(),
});

export type RuntimeJobRunListParams = z.infer<typeof runtimeJobRunListParamsSchema>;
