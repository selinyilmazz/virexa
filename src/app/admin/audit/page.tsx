import type { Metadata } from "next";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/category/Pagination";
import { AdminAuditFilters } from "@/components/admin/AdminAuditFilters";
import { getAuditLogPage } from "@/services/admin/admin-audit-service";
import type { AuditLogRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Audit Log | Virexa Admin",
};

const PAGE_SIZE = 25;

type AdminAuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toStringParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function formatMetadata(metadata: Record<string, unknown>): string {
  const json = JSON.stringify(metadata);
  return json.length > 140 ? `${json.slice(0, 140)}…` : json;
}

const columns: AdminTableColumn<AuditLogRow>[] = [
  { key: "created_at", header: "Time", render: (row) => new Date(row.created_at).toLocaleString() },
  { key: "actor_email", header: "Actor", render: (row) => row.actor_email || row.actor_id || "system" },
  { key: "action", header: "Action", className: "font-mono text-xs text-slate-700" },
  {
    key: "target",
    header: "Target",
    render: (row) => (row.target_type ? `${row.target_type}${row.target_id ? `:${row.target_id.slice(0, 8)}` : ""}` : "—"),
  },
  {
    key: "metadata",
    header: "Details",
    className: "max-w-[320px] whitespace-normal font-mono text-xs text-slate-500",
    render: (row) => formatMetadata(row.metadata),
  },
];

/**
 * Admin Audit Log (requirement 5) - read-only, newest-first, one
 * optional action filter. Backed by `admin_audit_log`
 * (`supabase/migrations/0003_admin_audit_log.sql`) via
 * `getAuditLogPage()`; see that service's doc comment for why a real
 * table exists this phase and how the "extensible service layer"
 * fallback the requirement describes still applies (every write funnels
 * through one `recordAuditEvent()` entry point).
 */
export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(toStringParam(params.page)) || 1);
  const action = toStringParam(params.action);

  const logPage = await getAuditLogPage(page, PAGE_SIZE, action);

  function buildPageHref(targetPage: number): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page") continue;
      const raw = toStringParam(value);
      if (raw) query.set(key, raw);
    }
    query.set("page", String(targetPage));
    return `/admin/audit?${query.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Audit Log</h1>
        <p className="mt-1 text-sm text-slate-500">
          {logPage.total.toLocaleString()} recorded action{logPage.total === 1 ? "" : "s"}.
        </p>
      </div>

      <SectionCard title="Filters">
        <AdminAuditFilters />
      </SectionCard>

      <SectionCard title="Recent Activity">
        {logPage.items.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="No audit entries yet"
            description="Admin actions (role changes, source/trust-score updates, manual pipeline runs, bulk operations) will appear here as they happen. If the service role key isn't configured, logging safely no-ops."
          />
        ) : (
          <>
            <AdminTable columns={columns} rows={logPage.items} getRowKey={(row) => row.id} emptyMessage="No audit entries yet." />
            <Pagination currentPage={logPage.page} totalPages={logPage.totalPages} buildHref={buildPageHref} />
          </>
        )}
      </SectionCard>
    </div>
  );
}
