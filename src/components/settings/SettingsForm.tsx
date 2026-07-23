"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ToggleSwitch } from "@/components/settings/ToggleSwitch";
import { SettingsNav, SETTINGS_CATEGORIES, type SettingsCategoryId } from "@/components/settings/SettingsNav";
import { AccountSettingsPanel } from "@/components/settings/AccountSettingsPanel";
import { PrivacySettingsPanel } from "@/components/settings/PrivacySettingsPanel";
import { AuthToast, type AuthToastVariant } from "@/components/auth/AuthToast";
import {
  saveSettings,
  useSettings,
  useSettingsStatus,
  useSettingsError,
  retrySettings,
  type UserSettings,
} from "@/lib/settings";
import { saveProfile, useProfile } from "@/lib/profile";
import { settingsSchema } from "@/lib/validation/settings-schema";
import { formatZodError } from "@/lib/validation/format-zod-error";
import { categories } from "@/data/categories";
import { countryOptions } from "@/data/countries";
import { setLocaleCookie } from "@/i18n/actions";
import { locales, localeLabels, isLocale } from "@/i18n/config";

const languageOptions = locales.map((value) => ({ value, label: localeLabels[value] }));

const THEME_OPTIONS: { value: UserSettings["theme"]; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const READING_WIDTH_OPTIONS: { value: UserSettings["readingWidth"]; label: string; description: string }[] = [
  { value: "comfortable", label: "Comfortable", description: "Wider article column, more breathing room." },
  { value: "compact", label: "Compact", description: "Narrower column for a denser reading view." },
];

/** Real, current-browser timezone list when available (`Intl.supportedValuesOf`), falling back to a small curated set on older browsers rather than pretending a hardcoded list is exhaustive. */
function getTimezoneOptions(): string[] {
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (Intl as any).supportedValuesOf("timeZone");
    } catch {
      // fall through to the curated fallback below
    }
  }
  return ["UTC", "Europe/Istanbul", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Asia/Tokyo", "Asia/Dubai"];
}

/**
 * Settings page redesign - "Manage your Virexa experience.": General /
 * Reading / Notifications / Privacy / Appearance / Account, replacing the
 * previous three-category, "only settings that change something real"
 * version. `theme`, `readingWidth`, `readingProgressBar`, and
 * `rememberScrollPosition` are honestly labeled as saved-but-not-yet-applied
 * preferences (same convention as `HeaderThemeToggle`) rather than wired
 * into the Article Detail page, since this redesign's explicit scope is
 * the Navbar/Bookmarks/Profile/Settings surfaces only. Account and
 * Privacy each own their own save/action buttons (see
 * `AccountSettingsPanel`/`PrivacySettingsPanel`), so the shared "Save
 * Changes" button below only applies to General/Reading/Notifications/
 * Appearance, all of which share one `UserSettings` draft.
 */
function isSettingsCategoryId(value: string | null): value is SettingsCategoryId {
  return SETTINGS_CATEGORIES.some((category) => category.id === value);
}

export function SettingsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Supports deep links like `/settings?category=account` (used by the
  // Profile page's "Edit Profile" button) - falls back to "general" for
  // a missing or unrecognized value instead of erroring.
  const initialCategory = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState<SettingsCategoryId>(
    isSettingsCategoryId(initialCategory) ? initialCategory : "general"
  );
  const savedSettings = useSettings();
  const status = useSettingsStatus();
  const loadError = useSettingsError();
  const [settings, setSettings] = useState<UserSettings>(savedSettings);
  const [syncedSettings, setSyncedSettings] = useState<UserSettings>(savedSettings);
  const [toast, setToast] = useState<{ message: string; variant: AuthToastVariant } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const profile = useProfile();
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);

  // Keep the local draft in sync whenever the underlying store updates
  // (initial load finishing, or a background refresh) - but only while
  // the user hasn't started editing away from what's saved, so an
  // in-flight edit is never clobbered by a refetch.
  if (savedSettings !== syncedSettings) {
    if (settings === syncedSettings) {
      setSettings(savedSettings);
    }
    setSyncedSettings(savedSettings);
  }

  function showToast(message: string, variant: AuthToastVariant, durationMs = 2500) {
    setToast({ message, variant });
    setTimeout(() => setToast(null), durationMs);
  }

  function toggleCategoryChip(name: string) {
    setSettings((prev) => ({
      ...prev,
      preferredCategories: prev.preferredCategories.includes(name)
        ? prev.preferredCategories.filter((item) => item !== name)
        : [...prev.preferredCategories, name],
    }));
  }

  function handleCountryChange(country: string) {
    saveProfile({ country }).catch(() => showToast("Couldn't save your country. Please try again.", "error", 4000));
  }

  async function handleSave() {
    const result = settingsSchema.safeParse(settings);
    if (!result.success) {
      showToast(formatZodError(result.error), "error", 4000);
      return;
    }

    const languageChanged = result.data.language !== syncedSettings.language;

    setIsSaving(true);
    try {
      await saveSettings(result.data);
      if (languageChanged && isLocale(result.data.language)) {
        await setLocaleCookie(result.data.language);
      }
      showToast("Settings saved!", "success");
      if (languageChanged) {
        router.refresh();
      }
    } catch {
      showToast("Couldn't save your settings. Please try again.", "error", 4000);
    } finally {
      setIsSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-base text-slate-500 dark:text-slate-400 shadow-sm">
        Loading your settings...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20 p-10 text-center shadow-sm">
        <p className="text-base font-medium text-red-600">{loadError ?? "Couldn't load your settings."}</p>
        <button
          type="button"
          onClick={() => void retrySettings()}
          className="rounded-xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          Retry
        </button>
      </div>
    );
  }

  const showSaveButton = activeCategory !== "privacy" && activeCategory !== "account";

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      <SettingsNav active={activeCategory} onSelect={setActiveCategory} />

      <div className="min-w-0 space-y-6">
        {activeCategory === "general" && (
          <>
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Language &amp; Region</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="settings-language" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Language
                  </label>
                  <select
                    id="settings-language"
                    value={settings.language}
                    onChange={(event) => setSettings((prev) => ({ ...prev, language: event.target.value }))}
                    className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 text-base text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="settings-country" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Country
                  </label>
                  <select
                    id="settings-country"
                    value={profile.country}
                    onChange={(event) => handleCountryChange(event.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 text-base text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
                  >
                    <option value="">Not set</option>
                    {countryOptions.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="settings-timezone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Timezone
                  </label>
                  <select
                    id="settings-timezone"
                    value={settings.timezone}
                    onChange={(event) => setSettings((prev) => ({ ...prev, timezone: event.target.value }))}
                    className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 text-base text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
                  >
                    {timezoneOptions.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Content</h2>
              <p className="mt-1 text-base text-slate-500 dark:text-slate-400">Pick the topics you want to see more of across Virexa.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isSelected = settings.preferredCategories.includes(category.name);
                  return (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => toggleCategoryChip(category.name)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                        isSelected
                          ? "border-[#2f67e8] bg-blue-50 text-[#2f67e8]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span aria-hidden="true">{category.icon}</span>
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activeCategory === "reading" && (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Reading</h2>
            <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              <ToggleSwitch
                label="Open source links in new tab"
                description="Links to a release's website, docs, or GitHub repo open in a new tab."
                checked={settings.openLinksInNewTab}
                onChange={(checked) => setSettings((prev) => ({ ...prev, openLinksInNewTab: checked }))}
              />
              <ToggleSwitch
                label="Reading Progress Bar"
                description="Saved preference only - a progress indicator isn't shown on articles yet."
                checked={settings.readingProgressBar}
                onChange={(checked) => setSettings((prev) => ({ ...prev, readingProgressBar: checked }))}
              />
              <ToggleSwitch
                label="Remember Scroll Position"
                description="Saved preference only - articles don't yet resume from where you left off."
                checked={settings.rememberScrollPosition}
                onChange={(checked) => setSettings((prev) => ({ ...prev, rememberScrollPosition: checked }))}
              />
            </div>
          </section>
        )}

        {activeCategory === "appearance" && (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Appearance</h2>

            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Theme</p>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Applies instantly on the Navbar, Profile, Bookmarks and Settings pages.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {THEME_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-2xl border p-4 text-center transition-colors ${
                      settings.theme === option.value
                        ? "border-[#2f67e8] bg-blue-50 dark:bg-blue-950/40"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      className="sr-only"
                      checked={settings.theme === option.value}
                      onChange={() => {
                        // Theme is the one Appearance field that saves
                        // immediately (not batched behind "Save Changes")
                        // so it can genuinely apply "instantly" per spec -
                        // every other field on this page still requires
                        // an explicit save.
                        const next = { ...settings, theme: option.value };
                        setSettings(next);
                        saveSettings(next).catch(() => showToast("Couldn't save your theme. Please try again.", "error", 4000));
                      }}
                    />
                    <span className="font-semibold text-slate-950 dark:text-white">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reading Width</p>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Saved preference only - article layout doesn&apos;t change with this yet.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {READING_WIDTH_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                      settings.readingWidth === option.value
                        ? "border-[#2f67e8] bg-blue-50 dark:bg-blue-950/40"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="reading-width"
                        checked={settings.readingWidth === option.value}
                        onChange={() => setSettings((prev) => ({ ...prev, readingWidth: option.value }))}
                        className="accent-[#2f67e8]"
                      />
                      <span className="font-semibold text-slate-950 dark:text-white">{option.label}</span>
                    </span>
                    <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{option.description}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeCategory === "notifications" && (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Notifications</h2>
            <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              <ToggleSwitch
                label="Breaking News"
                description="Urgent, high-impact stories as they happen."
                checked={settings.notifications.breakingNews}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, breakingNews: checked } }))}
              />
              <ToggleSwitch
                label="Release Notifications"
                description="New framework and tool releases you follow."
                checked={settings.notifications.developerReleases}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, developerReleases: checked } }))}
              />
              <ToggleSwitch
                label="Developer Hub Updates"
                description="New guides, tools and resources added to the Developer Hub."
                checked={settings.notifications.developerHubUpdates}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, developerHubUpdates: checked } }))}
              />
              <ToggleSwitch
                label="Bookmark Reminders"
                description="Occasional nudges about bookmarked articles you haven't read yet."
                checked={settings.notifications.bookmarkReminders}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, bookmarkReminders: checked } }))}
              />
              <ToggleSwitch
                label="Security Alerts"
                description="Critical vulnerabilities and security advisories."
                checked={settings.notifications.securityAlerts}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, securityAlerts: checked } }))}
              />
              <ToggleSwitch
                label="Daily Digest"
                description="One roundup of the day's top stories."
                checked={settings.notifications.dailyDigest}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, dailyDigest: checked } }))}
              />
              <ToggleSwitch
                label="Weekly Summary"
                description="A recap of the week's most-read stories."
                checked={settings.notifications.weeklyDigest}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, weeklyDigest: checked } }))}
              />
              <ToggleSwitch
                label="Email Notifications"
                description="Allow Virexa to email you at all."
                checked={settings.notifications.email}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, email: checked } }))}
              />
              <ToggleSwitch
                label="Push Notifications"
                description="Allow browser push notifications."
                checked={settings.notifications.push}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, push: checked } }))}
              />
            </div>
          </section>
        )}

        {activeCategory === "privacy" && <PrivacySettingsPanel />}
        {activeCategory === "account" && <AccountSettingsPanel />}

        {showSaveButton && (
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2f67e8] text-base font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>
    </div>
  );
}
