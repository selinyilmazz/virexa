import { aboutText, interests, languages } from "@/data/portfolio";

/**
 * Narrative paragraph (verbatim from the CV's Professional Profile) +
 * a compact Languages list. Interests render as a single muted line,
 * not their own subsection - a personal-color detail, not a headline.
 * `UAV Pilot License` is deliberately not shown here (see
 * `src/data/portfolio.ts`'s doc comment) - it doesn't reinforce the
 * developer narrative and would just add clutter.
 */
export function AboutSection() {
  return (
    <section
      id="about"
      className="mx-auto max-w-[1200px] border-t border-[var(--portfolio-border)] px-5 py-20 sm:px-8 sm:py-28"
    >
      <p className="text-sm font-medium tracking-wide text-[var(--portfolio-accent)] uppercase">About</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--portfolio-text)] sm:text-4xl">About Me</h2>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-lg leading-relaxed text-[var(--portfolio-muted)]">{aboutText}</p>

          {interests.length > 0 && (
            <p className="mt-6 text-sm text-[var(--portfolio-muted)]">
              <span className="font-semibold text-[var(--portfolio-text)]">Beyond code: </span>
              {interests.join(", ")}
            </p>
          )}
        </div>

        {languages.length > 0 && (
          <div className="rounded-2xl border border-[var(--portfolio-border)] bg-[var(--portfolio-surface)] p-6 sm:p-8">
            <h3 className="text-sm font-semibold tracking-wide text-[var(--portfolio-muted)] uppercase">
              Languages
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {languages.map((language) => (
                <li key={language.name} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--portfolio-text)]">{language.name}</span>
                  <span className="text-[var(--portfolio-muted)]">{language.level}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
