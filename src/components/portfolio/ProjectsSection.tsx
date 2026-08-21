import { projects } from "@/data/portfolio";
import { BarChartIcon, ExternalLinkIcon, GithubIcon, GlobeIcon, PulseIcon } from "./PortfolioIcons";

/**
 * Purely decorative per-project header art - a gradient block with a
 * loosely-themed icon, NOT a product screenshot. No real screenshot
 * exists for any of these projects, and faking one would misrepresent
 * what they actually look like; this is honest, abstract decoration
 * instead. Keyed by `slug` (from `src/data/portfolio.ts`), not stored
 * as data - purely a presentation choice.
 */
const DECORATIVE_ICON: Record<string, React.ReactNode> = {
  "market-price-comparison": <BarChartIcon className="size-10" />,
  "lichfield-heart-disease-prediction": <PulseIcon className="size-10" />,
  "virexa-ai-news": <GlobeIcon className="size-10" />,
};

/**
 * Case-study style cards (Problem / Solution + verified feature list),
 * not a dense template grid - large, single-column blocks read more
 * "senior engineer" than a 3-up card grid for a set this small. No
 * stars/percentages/metrics: only what's traceable to each project's
 * actual files (see `src/data/portfolio.ts`'s doc comment).
 */
export function ProjectsSection() {
  return (
    <section
      id="projects"
      className="mx-auto max-w-[1200px] border-t border-[var(--portfolio-border)] px-5 py-20 sm:px-8 sm:py-28"
    >
      <p className="text-sm font-medium tracking-wide text-[var(--portfolio-accent)] uppercase">Projects</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--portfolio-text)] sm:text-4xl">
        Featured Projects
      </h2>

      <div className="mt-12 flex flex-col gap-8">
        {projects.map((project) => (
          <article
            key={project.slug}
            className="overflow-hidden rounded-2xl border border-[var(--portfolio-border)] bg-[var(--portfolio-surface)]"
          >
            <div
              className="flex h-28 items-center justify-center sm:h-32"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--portfolio-accent) 22%, transparent), color-mix(in srgb, var(--portfolio-accent-soft) 22%, transparent))",
              }}
            >
              <span className="text-[var(--portfolio-accent)] opacity-70">{DECORATIVE_ICON[project.slug]}</span>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h3 className="text-xl font-bold text-[var(--portfolio-text)] sm:text-2xl">{project.name}</h3>
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-none items-center gap-2 rounded-full border border-[var(--portfolio-border)] px-4 py-2 text-sm font-medium text-[var(--portfolio-text)] transition-colors hover:border-[var(--portfolio-accent)]"
                  >
                    <GithubIcon className="size-4" />
                    View on GitHub
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                )}
              </div>

              <p className="mt-3 max-w-3xl text-base leading-relaxed text-[var(--portfolio-muted)]">
                {project.description}
              </p>

              {(project.problem || project.solution) && (
                <div className="mt-6 grid gap-6 border-t border-[var(--portfolio-border)] pt-6 sm:grid-cols-2">
                  {project.problem && (
                    <div>
                      <h4 className="text-xs font-semibold tracking-wide text-[var(--portfolio-accent)] uppercase">
                        Problem
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--portfolio-muted)]">
                        {project.problem}
                      </p>
                    </div>
                  )}
                  {project.solution && (
                    <div>
                      <h4 className="text-xs font-semibold tracking-wide text-[var(--portfolio-accent)] uppercase">
                        Solution
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--portfolio-muted)]">
                        {project.solution}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {project.features && project.features.length > 0 && (
                <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                  {project.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-[var(--portfolio-text)]">
                      <span className="mt-1.5 size-1.5 flex-none rounded-full bg-[var(--portfolio-accent)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-lg border border-[var(--portfolio-border)] bg-[var(--portfolio-bg)] px-3 py-1.5 text-sm text-[var(--portfolio-text)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
