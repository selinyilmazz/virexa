import { skills } from "@/data/portfolio";

/**
 * Category-grouped skill list, deliberately no proficiency indicators
 * (stars/percentage bars) - those read as subjective/unverifiable and
 * don't fit the "senior product site" reference points this route is
 * built around. Each item here is a category card; items inside render
 * as plain chips, no visual weighting between them.
 */
export function SkillsSection() {
  return (
    <section
      id="skills"
      className="mx-auto max-w-[1200px] border-t border-[var(--portfolio-border)] px-5 py-20 sm:px-8 sm:py-28"
    >
      <p className="text-sm font-medium tracking-wide text-[var(--portfolio-accent)] uppercase">Skills</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--portfolio-text)] sm:text-4xl">
        Technical Skills
      </h2>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((category) => (
          <div
            key={category.category}
            className="rounded-2xl border border-[var(--portfolio-border)] bg-[var(--portfolio-surface)] p-6 sm:p-8"
          >
            <h3 className="text-sm font-semibold tracking-wide text-[var(--portfolio-muted)] uppercase">
              {category.category}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {category.items.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-[var(--portfolio-border)] bg-[var(--portfolio-bg)] px-3 py-1.5 text-sm text-[var(--portfolio-text)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
