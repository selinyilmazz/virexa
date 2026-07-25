"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings";

/**
 * The ONE real theme provider for the whole app - mounted exactly once,
 * in the root layout, wrapping every page (Home included). Replaces the
 * old `AuthedThemeScope`, which only wrapped Profile/Bookmarks/Settings:
 * that meant those three pages could silently render dark (whenever
 * `settings.theme` was "system" and the visitor's OS/browser preferred
 * dark) while Home - which never mounted any theme wrapper at all -
 * stayed light no matter what, so the same signed-in visitor saw two
 * different, inconsistent apps depending only on which page they were
 * on. "Do not force a dark theme on Profile or Settings; use the exact
 * same theme provider and layout behavior as the Home page" - the fix is
 * structural: there is now only one place in the entire app that decides
 * whether the `dark` class exists, and Home shares it.
 *
 * Still a wrapper `<div>` around the app content rather than a class on
 * `<html>` - `globals.css`'s `@custom-variant dark (&:where(.dark, .dark
 * *))` cascades to every descendant either way, and a `<div>` avoids
 * needing to reach outside React (`document.documentElement`) or deal
 * with an SSR/client class mismatch on `<html>` (the server has no way
 * to know the visitor's OS preference before first paint).
 *
 * Most pages (Home, Article, Developer Hub, Admin, ...) simply have no
 * `dark:` utility classes on their own elements yet, so mounting them
 * inside this shared scope changes nothing about how they look - it just
 * means when they DO get real dark styling later, it'll already be
 * wired up correctly instead of needing its own bespoke wrapper.
 */
export function ThemeScope({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPrefersDark(media.matches);
    function handleChange(event: MediaQueryListEvent) {
      setSystemPrefersDark(event.matches);
    }
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  // "system" only follows the OS/browser preference when a visitor has
  // actually, deliberately chosen it in Settings > Appearance -
  // `defaultSettings.theme` (src/lib/settings.ts) is "light", not
  // "system", specifically so nobody who has never touched the Appearance
  // tab can be surprised by a dark page they never asked for just
  // because their OS happens to be in dark mode ("I never selected Dark
  // mode" - the actual bug report this fixes).
  const isDark = settings.theme === "dark" || (settings.theme === "system" && systemPrefersDark);

  return <div className={isDark ? "dark" : undefined}>{children}</div>;
}
