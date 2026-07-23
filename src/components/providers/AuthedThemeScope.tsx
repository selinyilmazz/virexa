"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings";

/**
 * Real, working dark mode (Navigation/Profile/Settings UX update),
 * scoped to exactly the pages that render it: Profile, Bookmarks, and
 * Settings. Wraps that page's `<Header />` + `<main>` together so the
 * navbar and page content switch theme as one unit, instantly, with no
 * page reload - `settings.theme` already comes from a live, synced
 * client store (`useSettings()`), so saving a new theme in the Settings
 * page's Appearance category (which now saves immediately, not behind
 * the batched "Save Changes" button - see `SettingsForm.tsx`) re-renders
 * every mounted `AuthedThemeScope` on the page immediately.
 *
 * Deliberately NOT applied to `<html>` globally: the rest of Virexa (the
 * homepage, article pages, Developer Hub, admin, etc.) has zero dark
 * styling today, so a global toggle would leave those pages half-styled.
 * See `globals.css`'s `@custom-variant dark` comment for how this class
 * on a wrapper `<div>` (rather than `<html>`) still cascades `dark:`
 * utilities to every descendant, including the shared `<Header />`.
 */
export function AuthedThemeScope({ children }: { children: React.ReactNode }) {
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

  const isDark = settings.theme === "dark" || (settings.theme === "system" && systemPrefersDark);

  return <div className={isDark ? "dark" : undefined}>{children}</div>;
}
