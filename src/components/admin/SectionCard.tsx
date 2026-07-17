import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * The one bordered-card shell every Admin section is built from -
 * matches the `rounded-3xl border border-slate-200 bg-white p-6
 * shadow-sm` convention already used everywhere on the public site
 * (`ArticleAIInsights`, `CategorySidebar`, etc.), so the admin area
 * reads as part of the same design system rather than a new one.
 * Reused across Dashboard/Health/Runtime and every placeholder page.
 */
export function SectionCard({ title, description, action, children, className = "" }: SectionCardProps) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
