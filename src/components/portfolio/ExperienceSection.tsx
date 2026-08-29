import { education, experience } from "@/data/portfolio";
import { PortfolioReveal } from "./PortfolioReveal";
import { BriefcaseIcon } from "./PortfolioIcons";

/**
 * `experience` is intentionally an empty array (see `src/data/portfolio.ts`'s
 * doc comment) - the CV has no Work/Internship Experience section, and
 * fabricating one would misrepresent Selin. Rather than skip this
 * section (it was explicitly requested) or silently render nothing,
 * this shows an honest, undramatic "not yet" state anchored to a real,
 * already-verified fact (`education[0].status`) - no invented job title,
 * company, or date. If `experience` is ever populated with real roles,
 * this renders a proper timeline instead - same row/rule pattern as
 * `EducationSection.tsx`, so the two stay visually consistent.
 */
export function ExperienceSection() {
  const currentStatus = education[0]?.status;

  return (
    <section
      id="experience"
      className="mx-auto max-w-[1240px] border-t border-[var(--portfolio-border)] px-6 py-20 sm:px-10 sm:py-28"
    >
      <PortfolioReveal>
        <p className="text-xs font-semibold tracking-[0.22em] text-[var(--portfolio-accent)] uppercase">Experience</p>
        <h2 className="portfolio-serif mt-3 text-4xl text-[var(--portfolio-text)] sm:text-5xl">Experience</h2>
      </PortfolioReveal>

      {experience.length > 0 ? (
        <div className="mt-14 flex flex-col">
          {experience.map((item, index) => (
            <PortfolioReveal
              key={`${item.company}-${item.role}`}
              delayMs={index * 60}
              className="portfolio-rule py-10 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="portfolio-serif text-2xl text-[var(--portfolio-text)]">{item.role}</h3>
                <span className="text-sm text-[var(--portfolio-muted)]">
                  {item.startDate} – {item.endDate}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-[var(--portfolio-accent)]">
                {item.company}
                {item.location ? ` · ${item.location}` : ""}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--portfolio-muted)]">{item.summary}</p>
              {item.responsibilities.length > 0 && (
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {item.responsibilities.map((resp) => (
                    <li key={resp} className="flex items-start gap-2.5 text-sm text-[var(--portfolio-text)]">
                      <span className="mt-1.5 size-1 flex-none bg-[var(--portfolio-accent)]" />
                      {resp}
                    </li>
                  ))}
                </ul>
              )}
            </PortfolioReveal>
          ))}
        </div>
      ) : (
        <PortfolioReveal delayMs={100}>
          <div className="mt-14 flex flex-col gap-5 border-t border-[var(--portfolio-border)] pt-10 sm:flex-row sm:items-start sm:gap-8">
            <span className="flex size-11 flex-none items-center justify-center border border-[var(--portfolio-border)] text-[var(--portfolio-accent)]">
              <BriefcaseIcon className="size-5" />
            </span>
            <div>
              <p className="portfolio-serif max-w-xl text-2xl leading-snug text-[var(--portfolio-text)] sm:text-[1.7rem]">
                No formal work experience yet{currentStatus ? ` — currently a ${currentStatus.toLowerCase()}` : ""}.
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--portfolio-muted)]">
                Building a professional foundation through coursework, IT training, and the self-directed projects
                featured above — actively looking for a first internship or junior role in software development.
              </p>
            </div>
          </div>
        </PortfolioReveal>
      )}
    </section>
  );
}
