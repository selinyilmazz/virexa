import { personalInfo } from "@/data/portfolio";
import { GithubIcon, LinkedinIcon, MailIcon } from "./PortfolioIcons";

export function PortfolioFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--portfolio-border)]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-5 py-10 text-sm text-[var(--portfolio-muted)] sm:flex-row sm:justify-between sm:px-8">
        <p>
          © {year} {personalInfo.name}. Built with Next.js.
        </p>
        <div className="flex items-center gap-5">
          <a
            href={personalInfo.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="transition-colors hover:text-[var(--portfolio-text)]"
          >
            <GithubIcon className="size-5" />
          </a>
          <a
            href={personalInfo.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="transition-colors hover:text-[var(--portfolio-text)]"
          >
            <LinkedinIcon className="size-5" />
          </a>
          <a
            href={`mailto:${personalInfo.email}`}
            aria-label="Email"
            className="transition-colors hover:text-[var(--portfolio-text)]"
          >
            <MailIcon className="size-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
