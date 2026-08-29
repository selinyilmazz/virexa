import { projects } from "@/data/portfolio";
import { PortfolioReveal } from "./PortfolioReveal";
import { ArrowUpRightIcon, GithubIcon } from "./PortfolioIcons";

/**
 * Magazine-index layout - large outlined row numbers + a hairline rule
 * between entries, not a card grid. No decorative gradient artwork
 * (removed from the prior pass) - nothing here claims to be a product
 * screenshot that doesn't exist; the typographic index number is
 * ornament, not a stand-in for one. Problem/Solution + verified feature
 * list are unchanged in substance from the previous pass, just restyled.
 */
export function ProjectsSection() {
  return (
    <section id="projects" className="mx-auto max-w-[1240px] px-6 py-20 sm:px-10 sm:py-28">
      <PortfolioReveal className="flex items-end justify-between gap-6 border-b border-[var(--portfolio-border)] pb-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-[var(--portfolio-accent)] uppercase">
            Selected Work
          </p>
          <h2 className="portfolio-serif mt-3 text-4xl text-[var(--portfolio-text)] sm:text-5xl">Projects</h2>
        </div>
        <p className="hidden text-sm text-[var(--portfolio-muted)] sm:block">
          {String(projects.length).padStart(2, "0")} projects
        </p>
      </PortfolioReveal>

      <div className="flex flex-col">
        {projects.map((project, index) => (
          <PortfolioReveal key={project.slug} delayMs={index * 60} className="portfolio-rule py-12 first:pt-14 sm:py-16">
            <article className="grid gap-8 lg:grid-cols-[auto_1fr] lg:gap-14">
              <span className="portfolio-serif portfolio-index-num text-6xl leading-none sm:text-7xl">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h3 className="portfolio-serif text-2xl text-[var(--portfolio-text)] sm:text-3xl">{project.name}</h3>
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="portfolio-link inline-flex flex-none items-center gap-1.5 text-sm font-medium text-[var(--portfolio-text)]"
                    >
                      <GithubIcon className="size-4" />
                      View on GitHub
                      <ArrowUpRightIcon className="size-3.5" />
                    </a>
                  )}
                </div>

                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--portfolio-muted)]">
                  {project.description}
                </p>

                {(project.problem || project.solution) && (
                  <div className="mt-8 grid gap-8 sm:grid-cols-2">
                    {project.problem && (
                      <div>
                        <h4 className="text-[11px] font-semibold tracking-[0.2em] text-[var(--portfolio-accent)] uppercase">
                          Problem
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--portfolio-muted)]">{project.problem}</p>
                      </div>
                    )}
                    {project.solution && (
                      <div>
                        <h4 className="text-[11px] font-semibold tracking-[0.2em] text-[var(--portfolio-accent)] uppercase">
                          Solution
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--portfolio-muted)]">{project.solution}</p>
                      </div>
                    )}
                  </div>
                )}

                {project.features && project.features.length > 0 && (
                  <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
                    {project.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-[var(--portfolio-text)]">
                        <span className="mt-1.5 size-1 flex-none bg-[var(--portfolio-accent)]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
                  {project.techStack.map((tech) => (
                    <span key={tech} className="text-xs font-medium tracking-wide text-[var(--portfolio-muted)] uppercase">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          </PortfolioReveal>
        ))}
      </div>
    </section>
  );
}
