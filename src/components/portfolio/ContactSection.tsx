import { personalInfo } from "@/data/portfolio";
import { PortfolioReveal } from "./PortfolioReveal";
import { ArrowUpRightIcon, GithubIcon, LinkedinIcon, MailIcon, MapPinIcon } from "./PortfolioIcons";

/**
 * Only the three already-verified channels (email, GitHub, LinkedIn) +
 * location - no contact form, no fabricated "available for
 * opportunities" claim. Restyled as a full-bleed editorial closing
 * statement instead of a boxed panel.
 */
export function ContactSection() {
  const githubDisplay = personalInfo.githubUrl.replace(/^https?:\/\//, "");
  const linkedinDisplay = personalInfo.linkedinUrl.replace(/^https?:\/\//, "");

  const items = [
    { href: `mailto:${personalInfo.email}`, icon: <MailIcon className="size-4" />, label: personalInfo.email, external: false },
    { href: personalInfo.githubUrl, icon: <GithubIcon className="size-4" />, label: githubDisplay, external: true },
    { href: personalInfo.linkedinUrl, icon: <LinkedinIcon className="size-4" />, label: linkedinDisplay, external: true },
  ];

  return (
    <section id="contact" className="mx-auto max-w-[1240px] border-t border-[var(--portfolio-border)] px-6 py-20 sm:px-10 sm:py-28">
      <PortfolioReveal>
        <p className="text-xs font-semibold tracking-[0.22em] text-[var(--portfolio-accent)] uppercase">
          Let&apos;s work together
        </p>
        <h2 className="portfolio-serif mt-4 max-w-3xl text-4xl leading-[1.05] text-[var(--portfolio-text)] sm:text-6xl">
          I&apos;m open to new opportunities.
        </h2>
      </PortfolioReveal>

      <PortfolioReveal delayMs={120}>
        <a
          href={`mailto:${personalInfo.email}`}
          className="mt-10 inline-flex items-center gap-3 border border-[var(--portfolio-text)] px-8 py-4 text-sm font-semibold tracking-wide text-[var(--portfolio-text)] transition-colors hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)]"
        >
          Get in touch
          <ArrowUpRightIcon className="size-4" />
        </a>
      </PortfolioReveal>

      <PortfolioReveal delayMs={200}>
        <div className="mt-16 flex flex-wrap gap-x-12 gap-y-4 border-t border-[var(--portfolio-border)] pt-8">
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="portfolio-link flex items-center gap-2 text-sm text-[var(--portfolio-muted)] hover:text-[var(--portfolio-text)]"
            >
              {item.icon}
              <span className="break-all">{item.label}</span>
            </a>
          ))}
          <span className="flex items-center gap-2 text-sm text-[var(--portfolio-muted)]">
            <MapPinIcon className="size-4" />
            {personalInfo.location}
          </span>
        </div>
      </PortfolioReveal>
    </section>
  );
}
