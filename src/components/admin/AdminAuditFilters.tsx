"use client";

import { useRouter, useSearchParams } from "next/navigation";

const KNOWN_ACTIONS = [
  "source.active_toggled",
  "source.trust_score_updated",
  "source.bulk_activated",
  "source.bulk_deactivated",
  "source.bulk_trust_score_updated",
  "article.bulk_trending_refreshed",
  "user.role_changed",
  "user.suspended",
  "user.reactivated",
  "runtime.run_pipeline",
  "runtime.refresh_cache",
  "runtime.recalculate_trending",
  "runtime.retry_failed",
  "runtime.recalculate_trust",
] as const;

/** Single action-type filter for `/admin/audit` (requirement 5). Deliberately minimal - this log is a diagnostic trail, not a managed record set, so one filter plus pagination is enough. */
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
          {action}
        </option>
      ))}
    </select>
  );
}
