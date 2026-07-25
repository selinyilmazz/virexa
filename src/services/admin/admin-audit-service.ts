import { createServiceClient } from "@/lib/supabase/service-client";
import { createAuditLogRepository } from "@/repositories/audit-log-repository";
import { createProfileRepository } from "@/repositories/profile-repository";
import { deriveNameFromEmail } from "@/lib/supabase/utils";
import { describeAuditEvent, formatAuditActionLabel } from "@/lib/admin/audit-log-format";
import type { AuditLogRow } from "@/types/database";

/**
 * Extensible audit log service (requirement 5). Backed by a real table
 * (`admin_audit_log`, `supabase/migrations/0003_admin_audit_log.sql`) -
 * this phase DID add a migration, since a persistent, append-only log
 * is what "yönetilebilir bir SaaS ürünü" reasonably implies, and the
 * requirement's fallback clause ("gerçek tablo yoksa genişletilebilir
 * bir servis katmanı oluştur") is exactly what this file still is even
 * with a real table behind it: every write goes through the one
 * `recordAuditEvent()` entry point below, so swapping the storage
 * backend later (a queue, an external log sink) never touches any
 * calling code.
 *
 * Always uses the service-role client (the table has no RLS policies -
 * see the migration) and NEVER throws: a logging failure must never
 * break the primary admin action it's attached to (a role change, a
 * source update, a pipeline run all still succeed even if, say, the
 * service role key isn't configured - the same "missing config is a
 * normal, safe state" convention used everywhere else in this app).
 */

export type AuditActor = { id: string; email?: string | null };

export type RecordAuditEventInput = {
  actor: AuditActor;
  /** Short, dot-namespaced action id, e.g. "source.trust_score_updated", "user.role_changed", "runtime.pipeline_run". */
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

/** Appends one audit entry. Fire-and-forget from the caller's perspective - never throws, never blocks the primary action on a logging failure. */
export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      console.warn("[admin-audit-service] Service role not configured - skipping audit log write for action:", input.action);
      return;
    }

    const auditLogRepository = createAuditLogRepository(supabase);
    await auditLogRepository.record({
      actorId: input.actor.id,
      actorEmail: input.actor.email ?? "",
      action: input.action,
      targetType: input.targetType ?? "",
      targetId: input.targetId ?? "",
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    console.error("[admin-audit-service] recordAuditEvent failed:", error);
  }
}

/**
 * One audit row, enriched for display: `actorDisplayName` (a real name,
 * not a raw email, whenever the actor still has a `profiles` row -
 * see `resolveActorDisplayName` below), `actionLabel` (Title Case of the
 * raw action id, e.g. "User Role Changed" - used as a compact badge), and
 * `description` (the full, human sentence - e.g. "Password reset email
 * sent to user@example.com", built by `describeAuditEvent` from the
 * row's own real `metadata`, never fabricated).
 */
export type AuditLogItem = AuditLogRow & {
  actorDisplayName: string;
  actionLabel: string;
  description: string;
};

export type AuditLogPage = {
  items: AuditLogItem[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

function emptyAuditLogPage(page: number, pageSize: number): AuditLogPage {
  return { items: [], total: 0, totalPages: 1, page, pageSize };
}

/**
 * Resolves a real display name per unique `actor_id` in one batch lookup
 * (never one query per row - same "bulk lookup, not N+1" convention as
 * `admin-user-service.ts`'s `resolveDisplayName`). Prefers the actor's
 * `profiles.full_name`/`username` (what they'd recognize themselves as),
 * falls back to a name derived from their `actor_email` (the same
 * `deriveNameFromEmail` helper `getDisplayName()` uses site-wide), and
 * finally "System" for the rare row with neither (a service-role write
 * with no human actor, if one is ever added).
 */
async function resolveActorDisplayNames(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  rows: AuditLogRow[]
): Promise<Map<string, string>> {
  const actorIds = Array.from(new Set(rows.map((row) => row.actor_id).filter((id): id is string => Boolean(id))));
  const profiles = actorIds.length > 0 ? await createProfileRepository(supabase).getByIds(actorIds) : [];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  const nameByRowId = new Map<string, string>();
  for (const row of rows) {
    const profile = row.actor_id ? profileById.get(row.actor_id) : undefined;
    const name = profile?.full_name || profile?.username || (row.actor_email ? deriveNameFromEmail(row.actor_email) : undefined) || "System";
    nameByRowId.set(row.id, name);
  }
  return nameByRowId;
}

function toAuditLogItem(row: AuditLogRow, actorDisplayName: string): AuditLogItem {
  return { ...row, actorDisplayName, actionLabel: formatAuditActionLabel(row.action), description: describeAuditEvent(row) };
}

/** Paginated, newest-first audit log for the Admin Audit Log page. Requires the service-role client (no RLS policies on this table) - returns an empty page if it isn't configured, rather than throwing. */
export async function getAuditLogPage(page: number, pageSize: number, action?: string): Promise<AuditLogPage> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return emptyAuditLogPage(page, pageSize);

    const auditLogRepository = createAuditLogRepository(supabase);
    const result = await auditLogRepository.list({ page, pageSize, action });

    const nameByRowId = await resolveActorDisplayNames(supabase, result.items);

    return {
      items: result.items.map((row) => toAuditLogItem(row, nameByRowId.get(row.id) ?? "System")),
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
      page: result.page,
      pageSize: result.pageSize,
    };
  } catch (error) {
    console.error("[admin-audit-service] getAuditLogPage failed:", error);
    return emptyAuditLogPage(page, pageSize);
  }
}
