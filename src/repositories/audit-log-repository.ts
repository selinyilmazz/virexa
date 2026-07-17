import type { SupabaseClient } from "@supabase/supabase-js";
import { auditLogInputSchema, auditLogListParamsSchema } from "@/lib/validation/audit-log-schema";
import type { AuditLogInput, AuditLogListParams } from "@/lib/validation/audit-log-schema";
import type { AuditLogInsert, AuditLogRow, Database } from "@/types/database";

function toInsert(input: AuditLogInput): AuditLogInsert {
  return {
    actor_id: input.actorId ?? null,
    actor_email: input.actorEmail,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId,
    metadata: input.metadata,
  };
}

export type AuditLogListResult = {
  items: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Data access for the `admin_audit_log` table (requirement 5). Only ever
 * called with a service-role client (see `admin-audit-service.ts`) - the
 * table has RLS enabled with no policies, so a request-scoped client
 * could never read or write it anyway (see the migration's comment).
 */
export function createAuditLogRepository(supabase: SupabaseClient<Database>) {
  return {
    /** Appends one audit entry. Never updates/deletes - this table is append-only by design. */
    async record(rawInput: AuditLogInput): Promise<void> {
      const input = auditLogInputSchema.parse(rawInput);
      const { error } = await supabase.from("admin_audit_log").insert(toInsert(input));
      if (error) throw error;
    },

    /** Paginated, newest-first list for the Admin Audit Log page - optionally filtered to one `action`. */
    async list(rawParams: Partial<AuditLogListParams> = {}): Promise<AuditLogListResult> {
      const params = auditLogListParamsSchema.parse(rawParams);

      let query = supabase.from("admin_audit_log").select("*", { count: "exact" });
      if (params.action) query = query.eq("action", params.action);

      const from = (params.page - 1) * params.pageSize;
      const to = from + params.pageSize - 1;

      const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
      if (error) throw error;

      return { items: data ?? [], total: count ?? 0, page: params.page, pageSize: params.pageSize };
    },
  };
}

export type AuditLogRepository = ReturnType<typeof createAuditLogRepository>;
