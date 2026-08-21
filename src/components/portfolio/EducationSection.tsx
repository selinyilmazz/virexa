import { education } from "@/data/portfolio";
import { GraduationCapIcon } from "./PortfolioIcons";

/**
 * Vertical timeline ("journey" pattern from the redesign reference) -
 * used here for Education specifically because it's the only section
 * with real, dated milestones on the CV. There is no Work/Internship
 * Experience timeline (see `EducationItem`'s doc comment in
 * `src/data/portfolio.ts`) - do not add one. Every field below is
 * still optional and renders only when the CV actually stated it, same
 * as before this restyle - only the layout changed.
 */
export function EducationSection() {
  return (
    <section
      id="education"
      className="mx-auto max-w-[1200px] border-t border-[var(--portfolio-border)] px-5 py-20 sm:px-8 sm:py-28"
    >
      <p className="text-sm font-medium tracking-wide text-[var(--portfolio-accent)] uppercase">Education</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--portfolio-text)] sm:text-4xl">Education</h2>

      <div className="mt-12 flex flex-col">
        {education.map((item, index) => {
          const dateRange =
            item.startDate && item.endDate
              ? `${item.startDate} – ${item.endDate}`
              : (item.startDate ?? item.endDate);
          const isLast = index === education.length - 1;

          return (
            <div key={item.institution} className="flex gap-5">
              <div className="flex flex-col items-center">
                <span className="flex size-11 flex-none items-center justify-center rounded-full border border-[var(--portfolio-border)] bg-[var(--portfolio-surface)] text-[var(--portfolio-accent)]">
                  <GraduationCapIcon className="size-5" />
                </span>
                {!isLast && <span className="w-px flex-1 bg-[var(--portfolio-border)]" />}
              </div>

              <div className={isLast ? "pb-2" : "pb-10"}>
                <h3 className="pt-1.5 text-lg font-bold text-[var(--portfolio-text)]">{item.institution}</h3>
                <p className="mt-1 text-sm text-[var(--portfolio-muted)]">{item.field}</p>
                {item.degree && <p className="mt-1 text-sm text-[var(--portfolio-muted)]">{item.degree}</p>}

                {(item.status || dateRange || item.location) && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {item.status && (
                      <span className="inline-flex items-center rounded-full border border-[var(--portfolio-border)] bg-[var(--portfolio-bg)] px-3 py-1 text-xs font-medium text-[var(--portfolio-text)]">
                        {item.status}
                      </span>
                    )}
                    {dateRange && <span className="text-sm text-[var(--portfolio-muted)]">{dateRange}</span>}
                    {item.location && (
                      <span className="text-sm text-[var(--portfolio-muted)]">{item.location}</span>
                    )}
                  </div>
                )}

                {item.gpa && (
                  <p className="mt-4 text-sm text-[var(--portfolio-text)]">
                    <span className="font-semibold">GPA:</span> {item.gpa}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
