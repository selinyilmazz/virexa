import { education } from "@/data/portfolio";
import { PortfolioReveal } from "./PortfolioReveal";

/**
 * Numbered-row layout, matching `SkillsSection`/`ProjectsSection`'s
 * index-number pattern instead of the previous icon-timeline. Every
 * field is still fully optional and renders only when the CV actually
 * stated it (see `EducationItem`'s doc comment in
 * `src/data/portfolio.ts`) - only the layout changed.
 */
export function EducationSection() {
  return (
    <section
      id="education"
      className="mx-auto max-w-[1240px] border-t border-[var(--portfolio-border)] px-6 py-20 sm:px-10 sm:py-28"
    >
      <PortfolioReveal>
        <p className="text-xs font-semibold tracking-[0.22em] text-[var(--portfolio-accent)] uppercase">Education</p>
        <h2 className="portfolio-serif mt-3 text-4xl text-[var(--portfolio-text)] sm:text-5xl">Education</h2>
      </PortfolioReveal>

      <div className="mt-14 flex flex-col">
        {education.map((item, index) => {
          const dateRange =
            item.startDate && item.endDate ? `${item.startDate} – ${item.endDate}` : (item.startDate ?? item.endDate);

          return (
            <PortfolioReveal
              key={item.institution}
              delayMs={index * 60}
              className="portfolio-rule grid grid-cols-1 gap-4 py-10 first:border-t-0 first:pt-0 sm:grid-cols-[80px_1fr] sm:gap-8"
            >
              <span className="portfolio-serif portfolio-index-num text-3xl">{String(index + 1).padStart(2, "0")}</span>

              <div>
                <h3 className="portfolio-serif text-2xl text-[var(--portfolio-text)]">{item.institution}</h3>
                <p className="mt-1.5 text-sm text-[var(--portfolio-muted)]">{item.field}</p>
                {item.degree && <p className="mt-0.5 text-sm text-[var(--portfolio-muted)]">{item.degree}</p>}

                {(item.status || dateRange || item.location) && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    {item.status && <span className="font-medium text-[var(--portfolio-accent)]">{item.status}</span>}
                    {dateRange && <span className="text-[var(--portfolio-muted)]">{dateRange}</span>}
                    {item.location && <span className="text-[var(--portfolio-muted)]">{item.location}</span>}
                  </div>
                )}

                {item.gpa && (
                  <p className="mt-4 text-sm text-[var(--portfolio-text)]">
                    <span className="font-semibold">GPA</span> · {item.gpa}
                  </p>
                )}
              </div>
            </PortfolioReveal>
          );
        })}
      </div>
    </section>
  );
}
