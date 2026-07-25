import type { Metadata } from "next";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminAuditFilters } from "@/components/admin/AdminAuditFilters";
import { getAuditLogPage } from "@/services/admin/admin-audit-service";

export const metadata: Metadata = {
  title: "Audit Log | Virexa Admin",
};

// Same reasoning as every other admin listing page (`/admin/users`,
// `/admin/articles`, ...): always render fresh so a just-performed admin
// action shows up on the very next request, not after a cache purge.
export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

type AdminAuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toStringParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function toPageSizeParam(value: string | string[] | undefined): number {
  const raw = toStringParam(value);
  const parsed = raw ? Number(raw) : undefined;
  return parsed && ALLOWED_PAGE_SIZES.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

/** "25/07/2026 14:20" - a real, absolute, second-glance-readable timestamp (not a relative "3 hours ago") - an audit trail's whole point is knowing exactly when something happened. */
function formatTimestamp(iso: string): string {
  const formatted = new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatted.replace(",", "");
}

/**
 * Admin Audit Log (`/admin/audit`) - a real, dedicated, paginated history
 * of every admin-initiated write action (role changes, password resets,
 * source/content/catalog/repository/release edits, bulk operations,
 * runtime actions), backed by the `admin_audit_log` table that already
 * existed (`supabase/migrations/0003_admin_audit_log.sql`) but previously
 * had no standalone page - a prior redesign pass folded it into the
 * Dashboard's "Recent Activity" feed instead (see that page's doc
 * comment), which is a good live-updating summary but not a real,
 * searchable, fully paginated trail. This restores the dedicated page
 * alongside that feed (not instead of it) - traceability of admin
 * actions is exactly what an audit log is for.
 *
 * Each line reads as `<timestamp> — <actor> → <description>` (e.g. "25/07/2026
 * 14:20 — Selin Yılmaz → Password reset email sent to user@example.com"),
 * using `getAuditLogPage()`'s enrichment: a real actor name resolved from
 * `profiles` (falling back to a name derived from their email, never a
 * raw user id), and a real, per-action description built only from what
 * that action actually recorded - see `lib/admin/audit-log-format.ts`.
 */
export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(toStringParam(params.page)) || 1);
  const pageSize = toPageSizeParam(params.pageSize);
  const action = toStringParam(params.action);

  const auditPage = await getAuditLogPage(page, pageSize, action);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Audit Log</h1>
        <p className="mt-1 text-sm text-slate-500">
          {auditPage.total.toLocaleString()} recorded action{auditPage.total === 1 ? "" : "s"} - every role change, password
          reset, and content/catalog edit made from this admin panel, newest first.
        </p>
      </div>

      <SectionCard title="Filters">
        <AdminAuditFilters />
      </SectionCard>

      <SectionCard title="Action History">
        {auditPage.items.length === 0 ? (
          <EmptyState
            icon="🗒️"
            title="No audit events yet"
            description="Admin actions (role changes, password resets, content edits, and more) will appear here as soon as they happen, or Supabase's service role key isn't configured yet."
          />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {auditPage.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
                  <span className="shrink-0 whitespace-nowrap text-xs font-medium tabular-nums text-slate-400">
                    {formatTimestamp(item.created_at)}
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-slate-300">
                    —
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-slate-950">{item.actorDisplayName}</span>
                  <span aria-hidden="true" className="shrink-0 text-slate-400">
                    →
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-slate-700">{item.description}</span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                    {item.actionLabel}
                  </span>
                </li>
              ))}
            </ul>
            <AdminPagination page={auditPage.page} pageSize={pageSize} totalItems={auditPage.total} itemLabel="actions" />
          </>
        )}
      </SectionCard>
    </div>
  );
}
