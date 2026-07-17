import { z } from "zod";

/**
 * Server-side validation for `admin_audit_log` writes (see
 * `supabase/migrations/0003_admin_audit_log.sql`). Same convention as
 * `article-storage-schema.ts`: validated before it ever reaches the
 * repository/database.
 */
export const auditLogInputSchema = z.object({
  actorId: z.string().trim().min(1).nullable().optional(),
  actorEmail: z.string().trim().default(""),
  action: z.string().trim().min(1, "action is required."),
  targetType: z.string().trim().default(""),
  targetId: z.string().trim().default(""),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type AuditLogInput = z.infer<typeof auditLogInputSchema>;

export const auditLogListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  action: z.string().trim().min(1).optional(),
});

export type AuditLogListParams = z.infer<typeof auditLogListParamsSchema>;
