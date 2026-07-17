import { runtimeEngine } from "@/runtime/engine";
import { getRuntimeJobHistory } from "@/services/admin/admin-runtime-history-service";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";

type RuntimeStatusSectionProps = {
  /** Compact mode drops the per-job schedule table - used on the Dashboard home preview; the full `/admin/runtime` page shows both. */
  compact?: boolean;
};

function formatTimestamp(value?: string | null): string {
  return value ? new Date(value).toLocaleString() : "No runs recorded yet";
}

const scheduleColumns: AdminTableColumn<{ jobType: string; cron: string; intervalMs: number; isActive: boolean }>[] = [
  { key: "jobType", header: "Job Type" },
  { key: "cron", header: "Cron" },
  { key: "intervalMs", header: "Interval", render: (row) => `${Math.round(row.intervalMs / 60000)} min` },
  {
    key: "isActive",
    header: "Scheduler",
    render: (row) => <StatusBadge status={row.isActive ? "healthy" : "unknown"} label={row.isActive ? "Active" : "Inactive"} />,
  },
];

/**
 * Read-only Runtime overview (requirement 5): last run / last success /
 * last error, pipeline (scheduler) status, and queue status.
 *
 * Last Run/Last Success/Last Error come from `getRuntimeJobHistory()`,
 * which reads the durable `runtime_job_runs` table rather than
 * `runtimeEngine.queue`'s in-memory entries - a process-local `Map`
 * (see `runtime/queue/runtime-queue.ts`) that used to be this section's
 * only source and reported "No runs recorded yet" on any process that
 * hadn't itself run a job, even right after the pipeline had just
 * completed successfully in a different process/request
 * ("Memory yerine production uyumlu bir çözüm tasarla"). Queue stats
 * and the schedule table below still read `runtimeEngine` directly -
 * those are legitimately live, in-process state (what's queued/running
 * right now, what's scheduled), not history.
 */
export async function RuntimeStatusSection({ compact = false }: RuntimeStatusSectionProps) {
  const isRunning = runtimeEngine.isRunning;
  const stats = runtimeEngine.queue.getStats();
  const schedule = runtimeEngine.scheduler.getSchedule();

  const { lastRun, lastSuccess, lastFailure } = await getRuntimeJobHistory();

  return (
    <SectionCard
      title="Runtime Status"
      description="Read-only snapshot of the background job engine."
      action={<StatusBadge status={isRunning ? "healthy" : "unknown"} label={isRunning ? "Scheduler Running" : "Scheduler Stopped"} />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Run</p>
          <p className="mt-1 text-sm font-medium text-slate-950">{formatTimestamp(lastRun?.started_at ?? lastRun?.finished_at)}</p>
          {lastRun && <p className="mt-0.5 text-xs text-slate-500">{lastRun.job_type}</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Success</p>
          <p className="mt-1 text-sm font-medium text-slate-950">{formatTimestamp(lastSuccess?.finished_at)}</p>
          {lastSuccess && <p className="mt-0.5 text-xs text-slate-500">{lastSuccess.job_type}</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Error</p>
          <p className="mt-1 text-sm font-medium text-slate-950">{formatTimestamp(lastFailure?.finished_at)}</p>
          {lastFailure?.error && <p className="mt-0.5 line-clamp-2 text-xs text-red-600">{lastFailure.error}</p>}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Queue</p>
        <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {(Object.keys(stats) as (keyof typeof stats)[]).map((key) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <p className="text-lg font-bold text-slate-950">{stats[key]}</p>
              <p className="text-xs capitalize text-slate-500">{key}</p>
            </div>
          ))}
        </div>
      </div>

      {!compact && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-950">Schedule</h3>
          <div className="mt-3">
            <AdminTable
              columns={scheduleColumns}
              rows={schedule}
              getRowKey={(row) => row.jobType}
              emptyMessage="No scheduled jobs defined."
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}
