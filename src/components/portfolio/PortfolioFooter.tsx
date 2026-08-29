import { personalInfo } from "@/data/portfolio";
import { GithubIcon, LinkedinIcon, MailIcon, MapPinIcon } from "./PortfolioIcons";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "#projects", label: "Projects" },
  { href: "#about", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#experience", label: "Experience" },
  { href: "#education", label: "Education" },
  { href: "#certifications", label: "Certifications" },
];

export function PortfolioFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--portfolio-border)]">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <a href="#hero" className="portfolio-serif text-2xl text-[var(--portfolio-accent)]">
            SY.
          </a>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--portfolio-muted)]">{personalInfo.tagline}</p>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[var(--portfolio-muted)] uppercase">
            Navigation
          </h3>
          <ul className="mt-5 flex flex-col gap-3 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-[var(--portfolio-text)] transition-colors hover:text-[var(--portfolio-accent)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[var(--portfolio-muted)] uppercase">
            Contact
          </h3>
          <ul className="mt-5 flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-2 text-[var(--portfolio-muted)]">
              <MapPinIcon className="size-4" />
              {personalInfo.location}
            </li>
            <li>
              <a
                href={`mailto:${personalInfo.email}`}
                className="flex items-center gap-2 text-[var(--portfolio-text)] transition-colors hover:text-[var(--portfolio-accent)]"
              >
                <MailIcon className="size-4" />
                <span className="break-all">{personalInfo.email}</span>
              </a>
            </li>
            <li>
              <a
                href={personalInfo.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[var(--portfolio-text)] transition-colors hover:text-[var(--portfolio-accent)]"
              >
                <LinkedinIcon className="size-4" />
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href={personalInfo.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[var(--portfolio-text)] transition-colors hover:text-[var(--portfolio-accent)]"
              >
                <GithubIcon className="size-4" />
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--portfolio-border)]">
        <p className="mx-auto max-w-[1240px] px-6 py-6 text-xs text-[var(--portfolio-muted)] sm:px-10">
          © {year} {personalInfo.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
