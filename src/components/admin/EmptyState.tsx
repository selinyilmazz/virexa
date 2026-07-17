import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

/**
 * The one "nothing here yet" block every Admin surface uses - matches
 * the icon-circle + heading + description shape already established on
 * the public site (`EmptySearchState`, Home's "No articles yet" block).
 * Used both for genuinely empty data (no runs recorded yet) and for
 * this phase's placeholder menu pages (Articles/Sources/AI/Users/
 * Settings/Analytics) - "Hiçbir sayfa beyaz ekran göstermesin".
 */
export function EmptyState({ icon = "🛠️", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center">
      <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
        {icon}
      </span>
      <h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
