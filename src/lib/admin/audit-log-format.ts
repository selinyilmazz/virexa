import type { AuditLogRow } from "@/types/database";

/**
 * Human-readable formatting for `admin_audit_log` rows (see
 * `supabase/migrations/0003_admin_audit_log.sql`). Split out of
 * `admin-activity-service.ts`/`admin-audit-service.ts` so the Dashboard's
 * "Recent Activity" feed and the dedicated `/admin/audit` page render the
 * exact same wording for the same event, instead of two independently
 * maintained formatters drifting apart.
 *
 * Every description below is built ONLY from the real `action` id and
 * the real `metadata` a given admin route actually recorded (see each
 * `recordAuditEvent(...)` call site) - never a fabricated detail. Actions
 * without a hand-written case still get a real, honest description via
 * `genericDescription()` (Title Case of the action id, plus whatever
 * identifying metadata is actually present).
 */

function titleCase(value: string): string {
  return value
    .replace(/[._]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** e.g. "user.password_reset_sent" -> "User Password Reset Sent". Used as the audit list's compact action label/badge, and as the fallback description for any action id with no hand-written case below. */
export function formatAuditActionLabel(action: string): string {
  return titleCase(action);
}

function str(metadata: Record<string, unknown>, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

/** Best available "what this was about" string from a row's real metadata - tried in priority order, never guessed. */
function bestLabel(row: AuditLogRow): string | undefined {
  const meta = row.metadata ?? {};
  return (
    str(meta, "title") ??
    str(meta, "sourceName") ??
    str(meta, "product") ??
    str(meta, "name") ??
    str(meta, "targetEmail") ??
    str(meta, "slug") ??
    str(meta, "id") ??
    (row.target_id || undefined)
  );
}

function genericDescription(row: AuditLogRow): string {
  const label = bestLabel(row);
  return label ? `${formatAuditActionLabel(row.action)}: ${label}` : formatAuditActionLabel(row.action);
}

/**
 * Full, human sentence for one audit row - the `→ Password reset email
 * sent to user@example.com` half of an Audit Log line. Hand-written for
 * every action id currently recorded anywhere in the admin API (see
 * every `recordAuditEvent()` call site under `src/app/api/admin/`);
 * anything recorded in the future that isn't listed here still gets a
 * real, readable line via `genericDescription()`.
 */
export function describeAuditEvent(row: AuditLogRow): string {
  const meta = row.metadata ?? {};
  const targetEmail = str(meta, "targetEmail");
  const patch = meta.patch as Record<string, unknown> | undefined;

  switch (row.action) {
    case "user.password_reset_sent":
      return `Password reset email sent to ${targetEmail ?? "user"}`;
    case "user.role_changed": {
      const role = typeof patch?.role === "string" ? patch.role : undefined;
      const roleLabel = role === "admin" ? "Admin" : role === "user" ? "User" : "a new role";
      return `User role changed to ${roleLabel}${targetEmail ? ` (${targetEmail})` : ""}`;
    }
    case "user.suspended":
      return `User suspended${targetEmail ? `: ${targetEmail}` : ""}`;
    case "user.reactivated":
      return `User reactivated${targetEmail ? `: ${targetEmail}` : ""}`;
    case "user.deleted":
      return `User account deleted${targetEmail ? `: ${targetEmail}` : ""}`;

    case "source.created":
      return `Source added: ${str(meta, "name") ?? str(meta, "domain") ?? "new source"}`;
    case "source.deleted":
      return `Source removed${row.target_id ? `: ${row.target_id}` : ""}`;
    case "source.active_toggled":
      return `Source ${str(meta, "sourceName") ? `"${str(meta, "sourceName")}" ` : ""}active status changed`;
    case "source.trust_score_updated":
      return `Trust score updated${str(meta, "sourceName") ? ` for "${str(meta, "sourceName")}"` : ""}`;
    case "source.updated":
      return `Source updated${str(meta, "sourceName") ? `: ${str(meta, "sourceName")}` : ""}`;
    case "source.bulk_activated":
      return "Sources bulk-activated";
    case "source.bulk_deactivated":
      return "Sources bulk-deactivated";
    case "source.bulk_trust_score_updated":
      return "Trust score updated for multiple sources";

    case "article.created":
      return `Article created: ${str(meta, "title") ?? "untitled"}`;
    case "article.updated":
      return "Article updated";
    case "article.deleted":
      return `Article deleted${str(meta, "title") ? `: ${str(meta, "title")}` : ""}`;
    case "article.duplicated":
      return "Article duplicated";
    case "article.bulk_trending_refreshed":
      return "Trending status refreshed for multiple articles";

    case "catalog_item.created":
      return `Catalog item created${str(meta, "id") ? `: ${str(meta, "id")}` : ""}`;
    case "catalog_item.updated":
      return `Catalog item updated${row.target_id ? `: ${row.target_id}` : ""}`;
    case "catalog_item.deleted":
      return `Catalog item deleted${str(meta, "id") ? `: ${str(meta, "id")}` : ""}`;

    case "repository.created":
      return `Repository added${str(meta, "id") ? `: ${str(meta, "id")}` : ""}`;
    case "repository.updated":
      return `Repository updated${row.target_id ? `: ${row.target_id}` : ""}`;
    case "repository.deleted":
      return `Repository removed${str(meta, "id") ? `: ${str(meta, "id")}` : ""}`;
    case "repository.synced":
      return `Repository synced with GitHub${row.target_id ? `: ${row.target_id}` : ""}`;
    case "repository.bulk_synced": {
      const synced = meta.synced;
      const failed = meta.failed;
      return typeof synced === "number" ? `All repositories synced with GitHub (${synced} synced${typeof failed === "number" && failed > 0 ? `, ${failed} failed` : ""})` : "All repositories synced with GitHub";
    }

    case "release.created":
      return `Release added: ${str(meta, "product") ?? str(meta, "slug") ?? "new release"}`;
    case "release.updated":
      return `Release updated${row.target_id ? `: ${row.target_id}` : ""}`;
    case "release.deleted":
      return `Release removed: ${str(meta, "product") ?? str(meta, "slug") ?? row.target_id}`;

    case "collection.created":
      return `Collection created${str(meta, "slug") ? `: ${str(meta, "slug")}` : ""}`;
    case "collection.updated":
      return `Collection updated${row.target_id ? `: ${row.target_id}` : ""}`;
    case "collection.deleted":
      return "Collection deleted";

    case "settings.updated":
      return "Site settings updated";

    default:
      if (row.action.startsWith("runtime.")) {
        return `Runtime action run: ${titleCase(row.action.slice("runtime.".length))}`;
      }
      return genericDescription(row);
  }
}
