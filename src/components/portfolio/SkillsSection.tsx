import { skills } from "@/data/portfolio";
import { PortfolioReveal } from "./PortfolioReveal";

/**
 * Typographic index list (numbered categories, hairline rules) instead
 * of an icon-badge grid. Deliberate: the CV's real skill items (e.g.
 * "Database Fundamentals", "Project Management Fundamentals") don't
 * correspond to well-known brand icons the way "React"/"Docker" would,
 * so an icon grid here would mean either inventing icons for things
 * that don't have one or silently dropping real, verified skills to fit
 * the ones that do - both worse than an honest text list. No
 * proficiency bars/stars, same reasoning as the previous pass.
 */
export function SkillsSection() {
  return (
    <section
      id="skills"
      className="mx-auto max-w-[1240px] border-t border-[var(--portfolio-border)] px-6 py-20 sm:px-10 sm:py-28"
    >
      <PortfolioReveal>
        <p className="text-xs font-semibold tracking-[0.22em] text-[var(--portfolio-accent)] uppercase">Skills</p>
        <h2 className="portfolio-serif mt-3 text-4xl text-[var(--portfolio-text)] sm:text-5xl">Technical Skills</h2>
      </PortfolioReveal>

      <div className="mt-14 flex flex-col">
        {skills.map((category, index) => (
          <PortfolioReveal
            key={category.category}
            delayMs={index * 50}
            className="portfolio-rule grid grid-cols-1 gap-4 py-8 first:border-t-0 sm:grid-cols-[80px_1fr_auto] sm:items-baseline sm:gap-8"
          >
            <span className="portfolio-serif portfolio-index-num text-3xl">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="portfolio-serif text-xl text-[var(--portfolio-text)] sm:text-2xl">{category.category}</h3>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end">
              {category.items.map((item) => (
                <li key={item} className="text-sm text-[var(--portfolio-muted)]">
                  {item}
                </li>
              ))}
            </ul>
          </PortfolioReveal>
        ))}
      </div>
    </section>
  );
}
