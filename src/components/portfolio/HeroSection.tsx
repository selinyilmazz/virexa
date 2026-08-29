import { education, personalInfo, skills } from "@/data/portfolio";
import { PortfolioPortrait } from "./PortfolioPortrait";
import { PortfolioReveal } from "./PortfolioReveal";
import { ArrowUpRightIcon, DownloadIcon, GithubIcon, LinkedinIcon, MailIcon } from "./PortfolioIcons";

/**
 * Editorial redesign: the CV's identity line ("Computer Engineering
 * Student | Aspiring Software Developer") splits into an eyebrow label
 * + a smaller serif-italic subtitle - same two facts the old single
 * line carried, just given the visual hierarchy a magazine masthead
 * gives its byline. Falls back to the whole string as the eyebrow if
 * the "|" separator is ever removed from the data file.
 */
const [eyebrow, subtitle] = personalInfo.title.includes("|")
  ? personalInfo.title.split("|").map((part) => part.trim())
  : [personalInfo.title, undefined];

const nameParts = personalInfo.name.split(" ");
const initials = nameParts.map((part) => part[0]).join("");

// Real, already-verified facts only - no invented "available for work"
// status line. `education[0]` is Kahramanmaraş Sütçü İmam University,
// the CV's current/ongoing entry (see `src/data/portfolio.ts`).
const currentStatus = education[0]?.status;
const focusAreas = skills.slice(0, 3).map((category) => category.category);

export function HeroSection() {
  return (
    <section id="hero" className="relative border-b border-[var(--portfolio-border)]">
      <div className="mx-auto grid max-w-[1240px] gap-14 px-6 pt-14 pb-16 sm:px-10 sm:pt-20 sm:pb-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:pt-24">
        <div className="flex flex-col">
          <PortfolioReveal>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--portfolio-accent)] uppercase">
              {eyebrow}
            </p>
          </PortfolioReveal>

          <PortfolioReveal delayMs={80}>
            <h1 className="portfolio-serif mt-5 text-[15vw] leading-[0.92] font-medium tracking-tight text-[var(--portfolio-text)] sm:text-7xl lg:text-[5.5rem]">
              {nameParts.map((part) => (
                <span key={part} className="block">
                  {part}
                </span>
              ))}
            </h1>
          </PortfolioReveal>

          {subtitle && (
            <PortfolioReveal delayMs={140}>
              <p className="portfolio-serif mt-4 text-2xl text-[var(--portfolio-accent)] italic sm:text-3xl">
                {subtitle}
              </p>
            </PortfolioReveal>
          )}

          <PortfolioReveal delayMs={200}>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-[var(--portfolio-muted)] sm:text-lg">
              {personalInfo.tagline}
            </p>
          </PortfolioReveal>

          <PortfolioReveal delayMs={260}>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 border border-[var(--portfolio-text)] bg-[var(--portfolio-text)] px-7 py-3 text-sm font-semibold tracking-wide text-[var(--portfolio-bg)] transition-opacity hover:opacity-85"
              >
                View Projects
                <ArrowUpRightIcon className="size-4" />
              </a>
              <a
                href={personalInfo.cvUrl}
                download
                className="inline-flex items-center gap-2 border border-[var(--portfolio-border)] px-7 py-3 text-sm font-semibold tracking-wide text-[var(--portfolio-text)] transition-colors hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)]"
              >
                <DownloadIcon className="size-4" />
                Download CV
              </a>
            </div>
          </PortfolioReveal>

          <PortfolioReveal delayMs={320}>
            <div className="mt-14 flex items-center gap-5">
              <span className="text-xs font-semibold tracking-[0.2em] text-[var(--portfolio-muted)] uppercase">
                Let&apos;s connect
              </span>
              <span className="h-px w-10 bg-[var(--portfolio-border)]" />
              <a
                href={personalInfo.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-[var(--portfolio-muted)] transition-colors hover:text-[var(--portfolio-accent)]"
              >
                <GithubIcon className="size-5" />
              </a>
              <a
                href={personalInfo.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-[var(--portfolio-muted)] transition-colors hover:text-[var(--portfolio-accent)]"
              >
                <LinkedinIcon className="size-5" />
              </a>
              <a
                href={`mailto:${personalInfo.email}`}
                aria-label="Email"
                className="text-[var(--portfolio-muted)] transition-colors hover:text-[var(--portfolio-accent)]"
              >
                <MailIcon className="size-5" />
              </a>
            </div>
          </PortfolioReveal>
        </div>

        <PortfolioReveal delayMs={180} className="flex flex-col gap-8">
          <PortfolioPortrait src={personalInfo.portraitUrl} alt={personalInfo.name} initials={initials} />

          <dl className="grid grid-cols-1 gap-6 border-t border-[var(--portfolio-border)] pt-6 sm:grid-cols-3 lg:grid-cols-1">
            <div>
              <dt className="text-[11px] font-semibold tracking-[0.2em] text-[var(--portfolio-muted)] uppercase">
                Based in
              </dt>
              <dd className="portfolio-serif mt-1.5 text-lg text-[var(--portfolio-text)]">{personalInfo.location}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold tracking-[0.2em] text-[var(--portfolio-muted)] uppercase">
                Focus
              </dt>
              <dd className="mt-1.5 flex flex-col gap-0.5">
                {focusAreas.map((area) => (
                  <span key={area} className="text-sm text-[var(--portfolio-text)]">
                    {area}
                  </span>
                ))}
              </dd>
            </div>
            {currentStatus && (
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.2em] text-[var(--portfolio-muted)] uppercase">
                  Currently
                </dt>
                <dd className="portfolio-serif mt-1.5 text-lg text-[var(--portfolio-text)]">{currentStatus}</dd>
              </div>
            )}
          </dl>
        </PortfolioReveal>
      </div>
    </section>
  );
}
