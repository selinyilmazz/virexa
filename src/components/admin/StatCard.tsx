import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
};

/** One summary number, e.g. "Total Articles: 1,204" - the Dashboard home's basic building block (requirement 3). Purely presentational; callers pass already-resolved, real values. */
export function StatCard({ label, value, icon, hint }: StatCardProps) {
  const formattedValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2f67e8]">{icon}</span>}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{formattedValue}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
