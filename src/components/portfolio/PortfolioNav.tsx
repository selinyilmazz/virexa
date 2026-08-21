"use client";

import { useState } from "react";
import { personalInfo } from "@/data/portfolio";
import { PortfolioThemeToggle } from "./PortfolioThemeToggle";
import { CloseIcon, DownloadIcon, MenuIcon } from "./PortfolioIcons";

/**
 * Faz 3 complete - all sections that exist on the page have an anchor
 * here. `#experience` is intentionally not included - that section
 * doesn't exist (see `src/data/portfolio.ts`'s doc comment on
 * `experience`).
 */
const NAV_LINKS: { href: string; label: string }[] = [
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#education", label: "Education" },
  { href: "#certifications", label: "Certifications" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export function PortfolioNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--portfolio-border)] bg-[var(--portfolio-bg)]/85 backdrop-blur">
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        {/* Original wordmark for this personal site - deliberately not
            Virexa's identity in any way (no shared shape, color, or
            initials-in-a-circle pattern). Just Selin Yılmaz's own
            initials as bold accent-colored text next to her name. */}
        <a href="#hero" className="flex items-center gap-2">
          <span className="text-lg font-bold text-[var(--portfolio-accent)]">SY.</span>
          <span className="hidden text-sm font-medium text-[var(--portfolio-text)] sm:inline">
            {personalInfo.name}
          </span>
        </a>

        {/* Full inline nav only from `lg` (1024px) up - at `md` (768px)
            6 links + logo + Resume + toggle don't comfortably fit one
            row with no wrap fallback, so that range now gets the same
            hamburger menu as phones instead of a cramped nav. */}
        {NAV_LINKS.length > 0 && (
          <ul className="hidden items-center gap-8 text-sm font-medium text-[var(--portfolio-muted)] lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition-colors hover:text-[var(--portfolio-text)]">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3">
          <a
            href={personalInfo.cvUrl}
            download
            className="hidden items-center gap-2 rounded-full border border-[var(--portfolio-border)] px-4 py-2 text-sm font-medium text-[var(--portfolio-text)] transition-colors hover:border-[var(--portfolio-accent)] lg:inline-flex"
          >
            <DownloadIcon className="size-4" />
            Resume
          </a>
          <PortfolioThemeToggle />
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            className="flex size-9 items-center justify-center rounded-full border border-[var(--portfolio-border)] text-[var(--portfolio-text)] transition-colors hover:border-[var(--portfolio-accent)] lg:hidden"
          >
            {isMenuOpen ? <CloseIcon className="size-4" /> : <MenuIcon className="size-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile/tablet drawer (<lg) - mirrors the desktop links plus the
          Resume download, which is otherwise hidden below `lg`. Closes
          on any link tap. */}
      {isMenuOpen && (
        <div className="border-t border-[var(--portfolio-border)] bg-[var(--portfolio-bg)] px-5 py-4 sm:px-8 lg:hidden">
          <ul className="flex flex-col gap-1 text-sm font-medium text-[var(--portfolio-muted)]">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={closeMenu}
                  className="block rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--portfolio-surface)] hover:text-[var(--portfolio-text)]"
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
                className="flex items-center gap-2 rounded-lg px-2 py-2.5 font-medium text-[var(--portfolio-text)] transition-colors hover:bg-[var(--portfolio-surface)]"
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
