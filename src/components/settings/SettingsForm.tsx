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
import { useTranslations } from "@/i18n/i18n-provider";

// Each locale's own name (e.g. "Türkçe", "Nederlands") is intentionally
// NOT translated - a language's name is conventionally shown in that
// language itself in every language picker, regardless of the UI's
// current locale (`localeLabels` in `i18n/config.ts` already holds the
// native-language strings).
const languageOptions = locales.map((value) => ({ value, label: localeLabels[value] }));

const THEME_OPTIONS: { value: UserSettings["theme"]; labelKey: string }[] = [
  { value: "light", labelKey: "settings.appearance.themeLight" },
  { value: "dark", labelKey: "settings.appearance.themeDark" },
  { value: "system", labelKey: "settings.appearance.themeSystem" },
];

const READING_WIDTH_OPTIONS: { value: UserSettings["readingWidth"]; labelKey: string; descriptionKey: string }[] = [
  { value: "comfortable", labelKey: "settings.appearance.readingWidthComfortable", descriptionKey: "settings.appearance.readingWidthComfortableDescription" },
  { value: "compact", labelKey: "settings.appearance.readingWidthCompact", descriptionKey: "settings.appearance.readingWidthCompactDescription" },
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

/**
 * Distinguishes "the DB rejected this write because a column it expects
 * doesn't exist yet" (Postgres code 42703 - see
 * `settings-repository.ts`/`profile-repository.ts`, both of which
 * `.select("*").single()` after every upsert specifically so this class
 * of error surfaces as a real thrown error instead of a silent no-op)
 * from an ordinary transient failure. Checked against the raw message
 * text (not just the code) since the repositories re-throw Supabase's
 * error object as-is and its `code` isn't always preserved through every
 * error path - "does not exist" is what PostgREST always includes for a
 * missing-column error regardless.
 */
function isMissingColumnError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /does not exist/i.test(message) && /column/i.test(message);
}

/** Logs the full, untranslated error so it's actually findable in the browser console - the toast itself only ever shows a short, translated summary. */
function logSaveFailure(context: string, error: unknown) {
  console.error(`[SettingsForm] ${context} failed:`, error);
}

export function SettingsForm() {
  const t = useTranslations();
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
    saveProfile({ country }).catch((error: unknown) => {
      logSaveFailure("Country save", error);
      const message = isMissingColumnError(error)
        ? t("settings.general.countryErrorSchemaToast")
        : t("settings.general.countryErrorToast");
      // Schema errors stay up long enough to actually read and act on -
      // this isn't a "try again" case, retrying changes nothing.
      showToast(message, "error", isMissingColumnError(error) ? 10000 : 4000);
    });
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
      showToast(t("settings.savedToast"), "success");
      if (languageChanged) {
        router.refresh();
      }
    } catch (error) {
      logSaveFailure("Settings save", error);
      const message = isMissingColumnError(error) ? t("settings.saveErrorSchemaToast") : t("settings.saveErrorToast");
      // Schema errors stay up long enough to actually read and act on -
      // this isn't a "try again" case, retrying changes nothing.
      showToast(message, "error", isMissingColumnError(error) ? 10000 : 4000);
    } finally {
      setIsSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-base text-slate-500 dark:text-slate-400 shadow-sm">
        {t("settings.loading")}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20 p-10 text-center shadow-sm">
        <p className="text-base font-medium text-red-600">{loadError ?? t("settings.loadError")}</p>
        <button
          type="button"
          onClick={() => void retrySettings()}
          className="rounded-xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          {t("common.retry")}
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
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("settings.general.languageRegionTitle")}</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="settings-language" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t("settings.general.languageLabel")}
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
                    {t("settings.general.countryLabel")}
                  </label>
                  <select
                    id="settings-country"
                    value={profile.country}
                    onChange={(event) => handleCountryChange(event.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 text-base text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
                  >
                    <option value="">{t("settings.general.countryNotSet")}</option>
                    {countryOptions.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="settings-timezone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t("settings.general.timezoneLabel")}
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
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("settings.general.contentTitle")}</h2>
              <p className="mt-1 text-base text-slate-500 dark:text-slate-400">{t("settings.general.contentDescription")}</p>
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
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("settings.nav.reading")}</h2>
            <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              <ToggleSwitch
                label={t("settings.reading.openLinksLabel")}
                description={t("settings.reading.openLinksDescription")}
                checked={settings.openLinksInNewTab}
                onChange={(checked) => setSettings((prev) => ({ ...prev, openLinksInNewTab: checked }))}
              />
              <ToggleSwitch
                label={t("settings.reading.progressBarLabel")}
                description={t("settings.reading.progressBarDescription")}
                checked={settings.readingProgressBar}
                onChange={(checked) => setSettings((prev) => ({ ...prev, readingProgressBar: checked }))}
              />
              <ToggleSwitch
                label={t("settings.reading.rememberScrollLabel")}
                description={t("settings.reading.rememberScrollDescription")}
                checked={settings.rememberScrollPosition}
                onChange={(checked) => setSettings((prev) => ({ ...prev, rememberScrollPosition: checked }))}
              />
            </div>
          </section>
        )}

        {activeCategory === "appearance" && (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("settings.appearance.title")}</h2>

            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("settings.appearance.themeLabel")}</p>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t("settings.appearance.themeDescription")}</p>
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
                        saveSettings(next).catch(() => showToast(t("settings.appearance.themeErrorToast"), "error", 4000));
                      }}
                    />
                    <span className="font-semibold text-slate-950 dark:text-white">{t(option.labelKey)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("settings.appearance.readingWidthLabel")}</p>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t("settings.appearance.readingWidthDescription")}</p>
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
                      <span className="font-semibold text-slate-950 dark:text-white">{t(option.labelKey)}</span>
                    </span>
                    <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{t(option.descriptionKey)}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeCategory === "notifications" && (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("settings.notifications.title")}</h2>
            <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              <ToggleSwitch
                label={t("settings.notifications.breakingNewsLabel")}
                description={t("settings.notifications.breakingNewsDescription")}
                checked={settings.notifications.breakingNews}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, breakingNews: checked } }))}
              />
              <ToggleSwitch
                label={t("settings.notifications.releaseLabel")}
                description={t("settings.notifications.releaseDescription")}
                checked={settings.notifications.developerReleases}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, developerReleases: checked } }))}
              />
              <ToggleSwitch
                label={t("settings.notifications.hubUpdatesLabel")}
                description={t("settings.notifications.hubUpdatesDescription")}
                checked={settings.notifications.developerHubUpdates}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, developerHubUpdates: checked } }))}
              />
              <ToggleSwitch
                label={t("settings.notifications.bookmarkRemindersLabel")}
                description={t("settings.notifications.bookmarkRemindersDescription")}
                checked={settings.notifications.bookmarkReminders}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, bookmarkReminders: checked } }))}
              />
              <ToggleSwitch
                label={t("settings.notifications.securityAlertsLabel")}
                description={t("settings.notifications.securityAlertsDescription")}
                checked={settings.notifications.securityAlerts}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, securityAlerts: checked } }))}
              />
              <ToggleSwitch
                label={t("settings.notifications.dailyDigestLabel")}
                description={t("settings.notifications.dailyDigestDescription")}
                checked={settings.notifications.dailyDigest}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, dailyDigest: checked } }))}
              />
              <ToggleSwitch
                label={t("settings.notifications.weeklyDigestLabel")}
                description={t("settings.notifications.weeklyDigestDescription")}
                checked={settings.notifications.weeklyDigest}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, weeklyDigest: checked } }))}
              />
              <ToggleSwitch
                label={t("settings.notifications.emailLabel")}
                description={t("settings.notifications.emailDescription")}
                checked={settings.notifications.email}
                onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, email: checked } }))}
              />
              <ToggleSwitch
                label={t("settings.notifications.pushLabel")}
                description={t("settings.notifications.pushDescription")}
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
            {isSaving ? t("common.saving") : t("settings.saveButton")}
          </button>
        )}
      </div>
    </div>
  );
}
