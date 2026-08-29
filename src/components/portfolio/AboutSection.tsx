import { aboutText, interests, languages } from "@/data/portfolio";
import { PortfolioReveal } from "./PortfolioReveal";

/**
 * Editorial pull-quote layout: the CV's Professional Profile paragraph
 * (verbatim, unchanged) set large as a lede, with Languages/Interests as
 * a quiet sidebar list rather than boxed cards. `UAV Pilot License`
 * stays deliberately excluded (see `src/data/portfolio.ts`).
 */
export function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-[1240px] border-t border-[var(--portfolio-border)] px-6 py-20 sm:px-10 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-20">
        <div>
          <PortfolioReveal>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--portfolio-accent)] uppercase">About</p>
            <h2 className="portfolio-serif mt-3 text-4xl text-[var(--portfolio-text)] sm:text-5xl">Who I am</h2>
          </PortfolioReveal>

          <PortfolioReveal delayMs={100}>
            <p className="portfolio-serif mt-9 max-w-2xl text-2xl leading-snug text-[var(--portfolio-text)] sm:text-[1.85rem]">
              {aboutText}
            </p>
          </PortfolioReveal>

          {interests.length > 0 && (
            <PortfolioReveal delayMs={180}>
              <p className="mt-9 max-w-xl text-sm leading-relaxed text-[var(--portfolio-muted)]">
                <span className="font-semibold text-[var(--portfolio-text)]">Beyond code — </span>
                {interests.join(" · ")}
              </p>
            </PortfolioReveal>
          )}
        </div>

        {languages.length > 0 && (
          <PortfolioReveal delayMs={140}>
            <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[var(--portfolio-muted)] uppercase">
              Languages
            </h3>
            <ul className="mt-5 flex flex-col">
              {languages.map((language) => (
                <li
                  key={language.name}
                  className="portfolio-rule flex items-baseline justify-between py-3 first:border-t-0 first:pt-0"
                >
                  <span className="portfolio-serif text-lg text-[var(--portfolio-text)]">{language.name}</span>
                  <span className="text-sm text-[var(--portfolio-muted)]">{language.level}</span>
                </li>
              ))}
            </ul>
          </PortfolioReveal>
        )}
      </div>
    </section>
  );
}
