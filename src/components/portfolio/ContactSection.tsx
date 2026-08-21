import { personalInfo } from "@/data/portfolio";
import { ArrowRightIcon, GithubIcon, LinkedinIcon, MailIcon, MapPinIcon } from "./PortfolioIcons";

/**
 * Only the three already-verified channels (email, GitHub, LinkedIn) +
 * location - no contact form (no backend/endpoint exists for one), no
 * phone/address, no other social accounts, no "available for
 * opportunities"-style status claim. Display text for GitHub/LinkedIn
 * is mechanically derived from the already-verified URLs (protocol
 * stripped), not new information.
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
    <section id="contact" className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 sm:py-28">
      <div className="rounded-3xl border border-[var(--portfolio-border)] bg-[var(--portfolio-surface)] p-8 sm:p-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-medium tracking-wide text-[var(--portfolio-accent)] uppercase">Contact</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--portfolio-text)] sm:text-4xl">
              Let&apos;s build something together.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--portfolio-muted)]">
              Feel free to reach out by email or connect on GitHub / LinkedIn.
            </p>
          </div>

          <a
            href={`mailto:${personalInfo.email}`}
            className="inline-flex flex-none items-center gap-2 rounded-full bg-[var(--portfolio-accent)] px-6 py-3 text-sm font-semibold text-[var(--portfolio-accent-contrast)] transition-opacity hover:opacity-90"
          >
            Get In Touch
            <ArrowRightIcon className="size-4" />
          </a>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-[var(--portfolio-border)] pt-8">
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="flex items-center gap-2 text-sm text-[var(--portfolio-muted)] transition-colors hover:text-[var(--portfolio-text)]"
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
      </div>
    </section>
  );
}
