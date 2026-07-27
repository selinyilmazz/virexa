import { runtimeEngine } from "@/runtime/engine";
import { getRuntimeJobHistory, isRuntimeRecentlyActive } from "@/services/admin/admin-runtime-history-service";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { getServerTranslations } from "@/i18n/get-server-translations";
import type { TFunction } from "@/i18n/translate";

type RuntimeStatusSectionProps = {
  /** Compact mode drops the per-job schedule table - used on the Dashboard home preview; the full `/admin/runtime` page shows both. */
  compact?: boolean;
};

function formatTimestamp(value: string | null | undefined, t: TFunction): string {
  return value ? new Date(value).toLocaleString() : t("admin.runtime.noRunsRecorded");
}

function getScheduleColumns(t: TFunction): AdminTableColumn<{ jobType: string; cron: string; intervalMs: number }>[] {
  return [
    { key: "jobType", header: t("admin.runtime.columnJobType") },
    { key: "cron", header: t("admin.runtime.columnCron") },
    { key: "intervalMs", header: t("admin.runtime.columnInterval"), render: (row) => t("admin.runtime.minutesShort", { minutes: Math.round(row.intervalMs / 60000) }) },
  ];
}

/**
 * Read-only Runtime overview (requirement 5): last run / last success /
 * last error, real cron activity status, and recent-run counts.
 *
 * PRODUCTION ARCHITECTURE FIX ("Home sayfası taze ama Dashboard hâlâ eski
 * Last Run/Last Success/Scheduler Status/Queue gösteriyor"): every field
 * in this section now comes from `getRuntimeJobHistory()`, which reads
 * the durable `runtime_job_runs` table - written by `RuntimeQueue`'s
 * `onEntryFinished` hook the moment ANY job (news-fetch, any of the 9 AI
 * jobs, trending, ...) settles, regardless of which process/serverless
 * invocation ran it. This section used to ALSO read `runtimeEngine.isRunning`
 * and `runtimeEngine.queue.getStats()` directly - `runtimeEngine`'s
 * in-process, in-memory state. On Vercel, the Admin Dashboard page render
 * and the cron routes that actually trigger jobs (`/api/cron/news-fetch`,
 * `/api/cron/ai-enrichment`) run in DIFFERENT, isolated invocations that
 * never share memory - so `runtimeEngine.isRunning` was always `false`
 * ("Scheduler Stopped", regardless of how recently or successfully cron
 * had actually run) and `runtimeEngine.queue.getStats()` was always all
 * zeros (this request's own empty queue, never the cron route's). Those
 * two were the confirmed root cause: not stale caching, not a write-side
 * bug in the cron route (`persistRuntimeJobRun()` was already writing
 * correctly) - this SECTION was reading the wrong data source for those
 * two fields. Both pages that render this component
 * (`app/admin/page.tsx`, `app/admin/runtime/page.tsx`) now also export
 * `dynamic = "force-dynamic"` defensively, so this section's data is
 * never build-time/statically cached either, on top of the data-source
 * fix (`dynamic`/`revalidate` route config only has any effect when
 * exported from an actual route segment file - page/layout/route.ts -
 * not from an ordinary imported component module like this one, which
 * is why the route config lives on the two page files instead).
 *
 * The bottom "Schedule" table still reads `runtimeEngine.scheduler.getSchedule()`
 * directly, but only for its static `cron`/`intervalMs` columns (config,
 * not state) - the per-row "Active/Inactive" column that used to expose
 * the same in-memory `isRunning` problem at row level has been removed.
 */
export async function RuntimeStatusSection({ compact = false }: RuntimeStatusSectionProps) {
  const { t } = await getServerTranslations();
  const schedule = runtimeEngine.scheduler.getSchedule();
  const scheduleColumns = getScheduleColumns(t);

  const history = await getRuntimeJobHistory();
  const { lastRun, lastSuccess, lastFailure, recentByStatus } = history;
  const isActive = isRuntimeRecentlyActive(history);

  return (
    <SectionCard
      title={t("admin.runtime.title")}
      description={isActive ? t("admin.runtime.descriptionActive") : t("admin.runtime.descriptionInactive")}
      action={<StatusBadge status={isActive ? "healthy" : "unknown"} label={isActive ? t("admin.runtime.cronActive") : t("admin.runtime.noRecentRuns")} />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("admin.runtime.lastRun")}</p>
          <p className="mt-1 text-sm font-medium text-slate-950">{formatTimestamp(lastRun?.started_at ?? lastRun?.finished_at, t)}</p>
          {lastRun && <p className="mt-0.5 text-xs text-slate-500">{lastRun.job_type}</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("admin.runtime.lastSuccess")}</p>
          <p className="mt-1 text-sm font-medium text-slate-950">{formatTimestamp(lastSuccess?.finished_at, t)}</p>
          {lastSuccess && <p className="mt-0.5 text-xs text-slate-500">{lastSuccess.job_type}</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("admin.runtime.lastError")}</p>
          <p className="mt-1 text-sm font-medium text-slate-950">{formatTimestamp(lastFailure?.finished_at, t)}</p>
          {lastFailure?.error && <p className="mt-0.5 line-clamp-2 text-xs text-red-600">{lastFailure.error}</p>}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("admin.runtime.last26h")}</p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {(["completed", "failed", "cancelled"] as const).map((key) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <p className="text-lg font-bold text-slate-950">{recentByStatus[key] ?? 0}</p>
              <p className="text-xs capitalize text-slate-500">{t(`admin.runtime.status.${key}`)}</p>
            </div>
          ))}
        </div>
      </div>

      {!compact && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-950">{t("admin.runtime.schedule")}</h3>
          <p className="mt-1 text-xs text-slate-500">{t("admin.runtime.scheduleDescription")}</p>
          <div className="mt-3">
            <AdminTable
              columns={scheduleColumns}
              rows={schedule}
              getRowKey={(row) => row.jobType}
              emptyMessage={t("admin.runtime.noScheduledJobs")}
              errorHeading={t("admin.common.loadError")}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}
