"use client";

import { usePortfolioTheme } from "./PortfolioThemeScope";
import { MoonIcon, SunIcon } from "./PortfolioIcons";

export function PortfolioThemeToggle() {
  const { theme, toggleTheme } = usePortfolioTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex size-9 items-center justify-center rounded-full border border-[var(--portfolio-border)] text-[var(--portfolio-muted)] transition-colors hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-text)]"
    >
      {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </button>
  );
}
