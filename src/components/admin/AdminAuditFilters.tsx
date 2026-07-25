"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { formatAuditActionLabel } from "@/lib/admin/audit-log-format";

/**
 * Every real action id any admin route currently writes to
 * `admin_audit_log` (see every `recordAuditEvent(...)` call site under
 * `src/app/api/admin/`) - kept as one real, comprehensive list rather
 * than a handful of examples, so this filter can actually find any
 * recorded event instead of only a subset of them. Grouped by domain
 * (comments only, `<select>` has no native grouping requirement here)
 * purely to keep this list maintainable as new actions are added.
 */
const KNOWN_ACTIONS = [
  // Users
  "user.role_changed",
  "user.suspended",
  "user.reactivated",
  "user.deleted",
  "user.password_reset_sent",
  // Sources
  "source.created",
  "source.updated",
  "source.deleted",
  "source.active_toggled",
  "source.trust_score_updated",
  "source.bulk_activated",
  "source.bulk_deactivated",
  "source.bulk_trust_score_updated",
  // Articles
  "article.created",
  "article.updated",
  "article.deleted",
  "article.duplicated",
  "article.bulk_trending_refreshed",
  // Developer Hub Catalog
  "catalog_item.created",
  "catalog_item.updated",
  "catalog_item.deleted",
  // Repositories
  "repository.created",
  "repository.updated",
  "repository.deleted",
  "repository.synced",
  "repository.bulk_synced",
  // Developer Releases
  "release.created",
  "release.updated",
  "release.deleted",
  // GitHub Collections
  "collection.created",
  "collection.updated",
  "collection.deleted",
  // Settings
  "settings.updated",
  // Runtime
  "runtime.run_pipeline",
  "runtime.refresh_cache",
  "runtime.recalculate_trending",
  "runtime.retry_failed",
  "runtime.recalculate_trust",
  "runtime.backfill_images",
  "runtime.backfill_content",
  "runtime.backfill_categories",
  "runtime.backfill_ai_enrichment",
] as const;

/** Single action-type filter for `/admin/audit` (requirement 5). Deliberately minimal beyond the action list itself - this log is a diagnostic trail, not a managed record set, so one filter plus pagination is enough. Options show the same human-readable label (`formatAuditActionLabel`) the Audit Log page itself renders, not the raw dot-notation id. */
export function AdminAuditFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("action", value);
    else params.delete("action");
    params.delete("page");
    router.push(`/admin/audit?${params.toString()}`, { scroll: false });
  }

  return (
    <select
      defaultValue={searchParams.get("action") ?? ""}
      onChange={(event) => handleChange(event.target.value)}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
    >
      <option value="">All Actions</option>
      {KNOWN_ACTIONS.map((action) => (
        <option key={action} value={action}>
          {formatAuditActionLabel(action)}
        </option>
      ))}
    </select>
  );
}
