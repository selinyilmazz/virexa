import { runtimeEngine } from "@/runtime/engine";
import { buildHealthGroups } from "@/lib/admin/health-groups";
import { getRuntimeJobHistory, isRuntimeRecentlyActive } from "@/services/admin/admin-runtime-history-service";
import { getAuditLogPage } from "@/services/admin/admin-audit-service";

/**
 * Real, non-fabricated alerts for the Admin Header's notifications bell.
 * Every entry here is derived from data that already exists elsewhere in
 * the admin panel (System Health checks, Runtime job history, the Audit
 * Log) - this is purely a "surface it in one glanceable place" layer, not
 * a new source of truth, matching the same "never throws, degrades to
 * empty" convention as every other admin service in this app.
 */

export type AdminNotificationSeverity = "warning" | "offline" | "info";

export type AdminNotification = {
  id: string;
  severity: AdminNotificationSeverity;
  title: string;
  description: string;
  href: string;
  /** Only set for audit-derived entries, which have a real timestamp. Health/runtime alerts are "as of now" and don't have one. */
  createdAt?: string;
};

/** "source.trust_score_updated" -> "Source Trust Score Updated" - human-readable label for an audit log action id. */
function formatAuditAction(action: string): string {
  return action
    .replace(/[._]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const notifications: AdminNotification[] = [];

  try {
    const [healthReport, runtimeHistory, auditPage] = await Promise.all([
      runtimeEngine.checkHealth().catch((error: unknown) => {
        console.error("[admin-notifications-service] checkHealth failed:", error);
        return null;
      }),
      getRuntimeJobHistory(),
      getAuditLogPage(1, 5),
    ]);

    if (healthReport) {
      for (const group of buildHealthGroups(healthReport.checks)) {
        if (group.status === "warning" || group.status === "offline") {
          notifications.push({
            id: `health-${group.id}`,
            severity: group.status,
            title: `${group.label} needs attention`,
            description: group.message,
            href: "/admin",
          });
        }
      }
    }

    if (!isRuntimeRecentlyActive(runtimeHistory)) {
      notifications.push({
        id: "runtime-inactive",
        severity: "warning",
        title: "Runtime hasn't run recently",
        description: "No background job has completed in the last 26 hours.",
        href: "/admin/runtime",
      });
    }

    for (const entry of auditPage.items) {
      notifications.push({
        id: `audit-${entry.id}`,
        severity: "info",
        title: formatAuditAction(entry.action),
        description: entry.actor_email ? `by ${entry.actor_email}` : "System action",
        href: "/admin",
        createdAt: entry.created_at,
      });
    }
  } catch (error) {
    console.error("[admin-notifications-service] getAdminNotifications failed:", error);
  }

  return notifications;
}
