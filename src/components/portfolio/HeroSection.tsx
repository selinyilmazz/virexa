import { certifications, languages, personalInfo, projects, skills } from "@/data/portfolio";
import { AwardIcon, DownloadIcon, FolderCodeIcon, GithubIcon, GlobeIcon, LayersIcon, LinkedinIcon, MapPinIcon } from "./PortfolioIcons";

/**
 * No headshot (see the plan for this redesign pass - no real photo of
 * Selin was available, and a stock/AI-generated one would misrepresent
 * her). In its place: a small "developer object" code-block widget -
 * every field in it is read straight from `personalInfo`/`skills`, not
 * hand-typed marketing copy, so it can't drift out of sync with the
 * real data. The stat strip below is the same principle: every number
 * is `.length` on an already-verified array, never a hardcoded claim.
 */
const codeFields: { key: string; value: string }[] = [
  { key: "name", value: personalInfo.name },
  { key: "role", value: personalInfo.title },
  { key: "location", value: personalInfo.location },
];
const focusAreas = skills.map((category) => category.category);

const stats = [
  { icon: <FolderCodeIcon className="size-5" />, value: projects.length, label: "Projects" },
  { icon: <AwardIcon className="size-5" />, value: certifications.length, label: "Certifications" },
  { icon: <LayersIcon className="size-5" />, value: skills.length, label: "Skill Areas" },
  { icon: <GlobeIcon className="size-5" />, value: languages.length, label: "Languages" },
];

export function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 pt-16 pb-16 sm:px-8 sm:pt-24 sm:pb-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          {/* Was a tiny `uppercase` eyebrow tag - fit "Software Engineer"
              (17 chars) fine, but the CV's real, longer identity line
              ("Computer Engineering Student | Aspiring Software
              Developer", 61 chars) turned into an all-caps wall of text
              at that size. Same content, presented as a normal-case
              subtitle instead - `max-w-xl` keeps line length controlled
              on every viewport. */}
          <p className="max-w-xl text-base font-semibold text-[var(--portfolio-accent)] sm:text-lg">
            {personalInfo.title}
          </p>

          <h1 className="mt-4 max-w-xl text-5xl font-bold tracking-tight text-[var(--portfolio-text)] sm:text-6xl">
            {personalInfo.name.split(" ").map((part, index) => (
              <span key={part} className={index > 0 ? "portfolio-gradient-text block" : "block"}>
                {part}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--portfolio-muted)] sm:text-xl">
            {personalInfo.tagline}
          </p>

          <div className="mt-6 flex items-center gap-2 text-sm text-[var(--portfolio-muted)]">
            <MapPinIcon className="size-4" />
            {personalInfo.location}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href={`mailto:${personalInfo.email}`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--portfolio-accent)] px-6 py-3 text-sm font-semibold text-[var(--portfolio-accent-contrast)] transition-opacity hover:opacity-90"
            >
              Get in touch
            </a>
            <a
              href={personalInfo.cvUrl}
              download
              className="inline-flex items-center gap-2 rounded-full border border-[var(--portfolio-border)] px-6 py-3 text-sm font-semibold text-[var(--portfolio-text)] transition-colors hover:border-[var(--portfolio-accent)]"
            >
              <DownloadIcon className="size-4" />
              Download CV
            </a>
            <a
              href={personalInfo.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="flex size-11 items-center justify-center rounded-full border border-[var(--portfolio-border)] text-[var(--portfolio-muted)] transition-colors hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-text)]"
            >
              <GithubIcon className="size-5" />
            </a>
            <a
              href={personalInfo.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="flex size-11 items-center justify-center rounded-full border border-[var(--portfolio-border)] text-[var(--portfolio-muted)] transition-colors hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-text)]"
            >
              <LinkedinIcon className="size-5" />
            </a>
          </div>
        </div>

        {/* Decorative only - CSS blur, no image asset. `overflow-hidden`
            on the section above keeps these from ever causing a
            horizontal scrollbar. */}
        <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          <div className="pointer-events-none absolute -top-12 -right-8 size-56 rounded-full bg-[var(--portfolio-accent)] opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-8 size-48 rounded-full bg-[var(--portfolio-accent-soft)] opacity-20 blur-3xl" />

          <div className="relative rounded-2xl border border-[var(--portfolio-border)] bg-[var(--portfolio-surface)] p-6 shadow-2xl">
            <div className="flex items-center gap-1.5 pb-4">
              <span className="size-2.5 rounded-full bg-[var(--portfolio-muted)]/40" />
              <span className="size-2.5 rounded-full bg-[var(--portfolio-muted)]/40" />
              <span className="size-2.5 rounded-full bg-[var(--portfolio-muted)]/40" />
            </div>

            <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed sm:text-sm">
              <code>
                <span className="text-[var(--portfolio-accent)]">const</span>
                <span className="text-[var(--portfolio-text)]"> developer</span>
                <span className="text-[var(--portfolio-muted)]"> = {"{"}</span>
                {"\n"}
                {codeFields.map((field) => (
                  <span key={field.key}>
                    {"  "}
                    <span className="text-[var(--portfolio-text)]">{field.key}</span>
                    <span className="text-[var(--portfolio-muted)]">: </span>
                    <span className="text-[var(--portfolio-accent)]">&apos;{field.value}&apos;</span>
                    <span className="text-[var(--portfolio-muted)]">,</span>
                    {"\n"}
                  </span>
                ))}
                {"  "}
                <span className="text-[var(--portfolio-text)]">focus</span>
                <span className="text-[var(--portfolio-muted)]">: [</span>
                {"\n"}
                {focusAreas.map((area) => (
                  <span key={area}>
                    {"    "}
                    <span className="text-[var(--portfolio-accent)]">&apos;{area}&apos;</span>
                    <span className="text-[var(--portfolio-muted)]">,</span>
                    {"\n"}
                  </span>
                ))}
                {"  "}
                <span className="text-[var(--portfolio-muted)]">],</span>
                {"\n"}
                <span className="text-[var(--portfolio-muted)]">{"};"}</span>
              </code>
            </pre>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--portfolio-border)] bg-[var(--portfolio-surface)] p-5"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--portfolio-accent)]/10 text-[var(--portfolio-accent)]">
                {stat.icon}
              </span>
              <p className="mt-3 text-2xl font-bold text-[var(--portfolio-text)]">{stat.value}</p>
              <p className="text-sm text-[var(--portfolio-muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
