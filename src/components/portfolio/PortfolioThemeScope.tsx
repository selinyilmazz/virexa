"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "virexa_portfolio_theme";
const THEME_CHANGE_EVENT = "portfolio-theme-change";

/**
 * Deliberately independent from the site-wide `ThemeScope`
 * (`src/components/providers/ThemeScope.tsx`), not connected to it.
 *
 * The global theme is stored per-user in Supabase and defaults to
 * "light" for anyone not signed in - the portfolio's actual audience
 * (a recruiter clicking a link) will almost never be signed in, so the
 * global mechanism can never show them the "premium dark mode" this
 * route is designed around. This scope keeps its own preference in
 * `localStorage` instead, works for every visitor regardless of auth
 * state, and defaults to dark. It reuses `globals.css`'s existing
 * `@custom-variant dark (&:where(.dark, .dark *))` - putting `.dark` on
 * this wrapper `<div>` is enough to activate `dark:` utilities for
 * everything inside it, exactly like the global `ThemeScope` does for
 * the rest of the app - but scoped to this subtree only, so it can never
 * leak dark mode onto the rest of the site.
 */
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

export function usePortfolioTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("usePortfolioTheme must be used within PortfolioThemeScope");
  }
  return ctx;
}

/**
 * `localStorage` is only readable on the client, so its value can't be
 * known during SSR. `useSyncExternalStore` is the React-sanctioned way
 * to read this kind of external, non-React state without triggering a
 * hydration mismatch: it renders `getServerSnapshot`'s value ("dark")
 * for both the server pass and the initial client hydration pass, then
 * immediately re-renders with `getSnapshot`'s real value right after -
 * no manual `useEffect` + `setState` needed (which is both an
 * anti-pattern here and what `react-hooks/set-state-in-effect` flags).
 */
function getSnapshot(): Theme {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function getServerSnapshot(): Theme {
  return "dark";
}

function subscribe(onStoreChange: () => void) {
  // "storage" fires in other tabs on change; our own tab's toggle below
  // dispatches THEME_CHANGE_EVENT manually since "storage" never fires
  // in the tab that made the change.
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

/**
 * Runs synchronously, before React hydrates, as the first child of the
 * theme wrapper `<div>` - `document.currentScript.parentElement` is that
 * div. The div is server-rendered with the "dark" class by default
 * (matches `getServerSnapshot` above), so this only ever needs to
 * REMOVE it when a returning visitor previously chose light -
 * preventing a dark-then-light flash on load without ever needing to
 * touch `<html>`/`<body>` (which would leak across client-side
 * navigation to the rest of the site - same reasoning as the global
 * `ThemeScope` staying on a plain `<div>` instead).
 */
const INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    var root = document.currentScript && document.currentScript.parentElement;
    if (root && stored === "light") {
      root.classList.remove("dark");
    }
  } catch (e) {}
})();
`;

export function PortfolioThemeScope({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore - theme just won't persist across visits for this browser.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`portfolio-scope${theme === "dark" ? " dark" : ""}`} suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
