"use client";

import { useTranslations } from "@/i18n/i18n-provider";

export const SETTINGS_CATEGORIES = [
  { id: "general", labelKey: "settings.nav.general" },
  { id: "reading", labelKey: "settings.nav.reading" },
  { id: "notifications", labelKey: "settings.nav.notifications" },
  { id: "privacy", labelKey: "settings.nav.privacy" },
  { id: "appearance", labelKey: "settings.nav.appearance" },
  { id: "account", labelKey: "settings.nav.account" },
] as const;

export type SettingsCategoryId = (typeof SETTINGS_CATEGORIES)[number]["id"];

type SettingsNavProps = {
  active: SettingsCategoryId;
  onSelect: (id: SettingsCategoryId) => void;
};

/**
 * Settings category navigation (redesign): a sticky left sidebar on
 * larger screens, a horizontal scroll strip on mobile. Text-only labels
 * (no emoji icons - they read as a generic template, not a
 * purpose-built product) in a minimal, understated style closer to
 * Linear/Stripe settings than an admin console. `SettingsForm` owns the
 * actual section content and save behavior per category - this
 * component only controls which category is currently visible.
 */
export function SettingsNav({ active, onSelect }: SettingsNavProps) {
  const t = useTranslations();

  return (
    <nav
      aria-label={t("settings.nav.ariaLabel")}
      className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-sm lg:sticky lg:top-28 lg:flex-col lg:overflow-visible"
    >
      {SETTINGS_CATEGORIES.map((category) => {
        const isActive = category.id === active;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            aria-current={isActive ? "true" : undefined}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full ${
              isActive
                ? "bg-[#2f67e8] text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            {t(category.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}
