"use client";

import { useState } from "react";
import { personalInfo } from "@/data/portfolio";
import { PortfolioThemeToggle } from "./PortfolioThemeToggle";
import { CloseIcon, DownloadIcon, MenuIcon } from "./PortfolioIcons";

/** Every section on the page has an anchor here, in page order. */
const NAV_LINKS: { href: string; label: string }[] = [
  { href: "#projects", label: "Projects" },
  { href: "#about", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#experience", label: "Experience" },
  { href: "#education", label: "Education" },
  { href: "#certifications", label: "Certifications" },
  { href: "#contact", label: "Contact" },
];

export function PortfolioNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--portfolio-border)] bg-[var(--portfolio-bg)]/90 backdrop-blur">
      <nav className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-6 py-5 sm:px-10">
        {/* Original wordmark for this personal site - Selin Yılmaz's own
            initials, no shape/color/pattern borrowed from Virexa's identity. */}
        <a href="#hero" className="portfolio-serif flex items-baseline gap-2.5 text-[var(--portfolio-text)]">
          <span className="text-xl font-semibold text-[var(--portfolio-accent)]">SY.</span>
          <span className="hidden text-sm sm:inline">{personalInfo.name}</span>
        </a>

        {/* Full inline nav only from `lg` (1024px) up - below that, the
            hamburger drawer handles it (7 links + wordmark + Resume +
            toggle don't fit one row without wrapping). */}
        <ul className="hidden items-center gap-9 text-xs font-medium tracking-[0.12em] text-[var(--portfolio-muted)] uppercase lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="portfolio-link transition-colors hover:text-[var(--portfolio-text)]">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href={personalInfo.cvUrl}
            download
            className="hidden items-center gap-2 border border-[var(--portfolio-border)] px-4 py-2 text-xs font-semibold tracking-wide text-[var(--portfolio-text)] uppercase transition-colors hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)] lg:inline-flex"
          >
            <DownloadIcon className="size-3.5" />
            Resume
          </a>
          <PortfolioThemeToggle />
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            className="flex size-9 items-center justify-center border border-[var(--portfolio-border)] text-[var(--portfolio-text)] transition-colors hover:border-[var(--portfolio-accent)] lg:hidden"
          >
            {isMenuOpen ? <CloseIcon className="size-4" /> : <MenuIcon className="size-4" />}
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="border-t border-[var(--portfolio-border)] bg-[var(--portfolio-bg)] px-6 py-4 sm:px-10 lg:hidden">
          <ul className="flex flex-col gap-1 text-sm font-medium text-[var(--portfolio-muted)]">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={closeMenu}
                  className="block px-2 py-2.5 transition-colors hover:bg-[var(--portfolio-surface)] hover:text-[var(--portfolio-text)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="mt-2 border-t border-[var(--portfolio-border)] pt-2">
              <a
                href={personalInfo.cvUrl}
                download
                onClick={closeMenu}
                className="flex items-center gap-2 px-2 py-2.5 font-medium text-[var(--portfolio-text)] transition-colors hover:bg-[var(--portfolio-surface)]"
              >
                <DownloadIcon className="size-4" />
                Resume
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
