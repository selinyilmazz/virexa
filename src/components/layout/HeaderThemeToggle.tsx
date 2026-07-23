"use client";

import { useAuth } from "@/hooks/useAuth";
import { saveSettings, useSettings } from "@/lib/settings";

const CYCLE: Record<"system" | "light" | "dark", "system" | "light" | "dark"> = {
  system: "light",
  light: "dark",
  dark: "system",
};

/**
 * Dark mode toggle (Navigation/Profile/Settings UX update - was
 * deliberately passive/decorative before, see the removed doc comment on
 * this file's previous version). Now a real, working control: clicking
 * cycles System -> Light -> Dark -> System and saves immediately (no
 * "Save Changes" click needed), same as the Settings page's Appearance
 * category theme picker - both write to the same `settings.theme` via
 * `saveSettings()`, so they always agree.
 *
 * The visual effect is scoped to `AuthedThemeScope` (Profile/Bookmarks/
 * Settings pages only, see that file's doc comment) - clicking this
 * anywhere else still saves the real preference, it just won't repaint
 * the current page, since no other page has dark styling implemented yet.
 *
 * Only interactive when signed in (settings are per-user and every
 * dark-mode-scoped page already requires sign-in via middleware) - for a
 * signed-out visitor this renders the same passive icon it always did.
 */
export function HeaderThemeToggle() {
  const { user } = useAuth();
  const settings = useSettings();

  if (!user) {
    return (
      <span
        aria-hidden="true"
        className="hidden shrink-0 items-center justify-center text-slate-500 md:flex dark:text-slate-400"
      >
        <MoonIcon />
      </span>
    );
  }

  function handleClick() {
    void saveSettings({ ...settings, theme: CYCLE[settings.theme] });
  }

  const label =
    settings.theme === "system"
      ? "Theme: System (click for Light)"
      : settings.theme === "light"
        ? "Theme: Light (click for Dark)"
        : "Theme: Dark (click for System)";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="hidden shrink-0 items-center justify-center text-slate-500 transition-colors hover:text-[#2f67e8] md:flex dark:text-slate-400 dark:hover:text-blue-400"
    >
      <MoonIcon />
    </button>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.5 14.5a8.5 8.5 0 1 1-9-11 7 7 0 0 0 9 11Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
