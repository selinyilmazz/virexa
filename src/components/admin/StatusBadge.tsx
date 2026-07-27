"use client";

import { useTranslations } from "@/i18n/i18n-provider";

export type AdminStatus = "healthy" | "warning" | "offline" | "unknown";

const STATUS_STYLES: Record<AdminStatus, { labelKey: string; dot: string; badge: string }> = {
  healthy: { labelKey: "admin.status.healthy", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
  warning: { labelKey: "admin.status.warning", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  offline: { labelKey: "admin.status.offline", dot: "bg-red-500", badge: "bg-red-50 text-red-700" },
  unknown: { labelKey: "admin.status.unknown", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600" },
};

type StatusBadgeProps = {
  status: AdminStatus;
  /** Overrides the default label text (e.g. "Not Configured" instead of "Unknown") while keeping the same color. Callers pass already-translated text here. */
  label?: string;
};

/** Small colored pill for Healthy / Warning / Offline (requirement 4) - reused by Health Overview cards and, in later phases, anywhere else an admin surface needs a status at a glance. */
export function StatusBadge({ status, label }: StatusBadgeProps) {
  const t = useTranslations();
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${style.dot}`} />
      {label ?? t(style.labelKey)}
    </span>
  );
}
