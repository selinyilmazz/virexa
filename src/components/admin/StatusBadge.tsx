export type AdminStatus = "healthy" | "warning" | "offline" | "unknown";

const STATUS_STYLES: Record<AdminStatus, { label: string; dot: string; badge: string }> = {
  healthy: { label: "Healthy", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
  warning: { label: "Warning", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  offline: { label: "Offline", dot: "bg-red-500", badge: "bg-red-50 text-red-700" },
  unknown: { label: "Unknown", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600" },
};

type StatusBadgeProps = {
  status: AdminStatus;
  /** Overrides the default label text (e.g. "Not Configured" instead of "Unknown") while keeping the same color. */
  label?: string;
};

/** Small colored pill for Healthy / Warning / Offline (requirement 4) - reused by Health Overview cards and, in later phases, anywhere else an admin surface needs a status at a glance. */
export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${style.dot}`} />
      {label ?? style.label}
    </span>
  );
}
