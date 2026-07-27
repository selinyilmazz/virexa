import { runtimeEngine } from "@/runtime/engine";
import type { HealthCheckResult } from "@/runtime/health/health-monitor";
import { buildHealthGroups } from "@/lib/admin/health-groups";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatusBadge, type AdminStatus } from "@/components/admin/StatusBadge";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { getServerTranslations } from "@/i18n/get-server-translations";
import type { TFunction } from "@/i18n/translate";

type HealthOverviewSectionProps = {
  /** Compact mode drops the detailed per-check table - used on the Dashboard home preview; the full `/admin/health` page shows both. */
  compact?: boolean;
};

const CHECK_STATUS_LABEL: Record<HealthCheckResult["status"], AdminStatus> = {
  ok: "healthy",
  degraded: "warning",
  unconfigured: "warning",
  down: "offline",
};

function getColumns(t: TFunction): AdminTableColumn<HealthCheckResult>[] {
  return [
    { key: "id", header: t("admin.health.columnCheck") },
    {
      key: "status",
      header: t("admin.table.status"),
      render: (row) => <StatusBadge status={CHECK_STATUS_LABEL[row.status]} label={row.status} />,
    },
    { key: "message", header: t("admin.health.columnMessage"), className: "whitespace-normal text-slate-500" },
    { key: "durationMs", header: t("admin.health.columnDuration"), render: (row) => `${row.durationMs}ms` },
  ];
}

/**
 * System status cards - Database / Runtime / News Pipeline / AI
 * Providers / Cache (requirement 4), each Healthy / Warning / Offline.
 * Runs `runtimeEngine.checkHealth()` - the EXISTING health monitor
 * (`runtime/health/health-monitor.ts`), unmodified - and regroups its 7
 * raw checks via `buildHealthGroups`. Never throws on its own: a
 * `checkHealth()` failure would be unusual (every individual check
 * already catches its own errors), but this section still degrades to
 * an all-"unknown" state rather than crashing the page it's embedded in.
 */
export async function HealthOverviewSection({ compact = false }: HealthOverviewSectionProps) {
  const { t } = await getServerTranslations();
  let checks: HealthCheckResult[] = [];
  let checkedAt: string | null = null;

  try {
    const report = await runtimeEngine.checkHealth();
    checks = report.checks;
    checkedAt = report.checkedAt;
  } catch (error) {
    console.error("[HealthOverviewSection] checkHealth failed:", error);
  }

  const groups = buildHealthGroups(checks);
  const columns = getColumns(t);

  return (
    <SectionCard
      title={t("admin.health.title")}
      description={checkedAt ? t("admin.health.lastChecked", { time: new Date(checkedAt).toLocaleString() }) : t("admin.health.unavailable")}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {groups.map((group) => (
          <div key={group.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-950">{group.label}</p>
              <StatusBadge status={group.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-slate-500">{group.message}</p>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-950">{t("admin.health.rawChecks")}</h3>
          <div className="mt-3">
            <AdminTable
              columns={columns}
              rows={checks}
              getRowKey={(row) => row.id}
              emptyMessage={t("admin.health.emptyMessage")}
              errorHeading={t("admin.common.loadError")}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}
