"use client";

import { useState } from "react";
import { ToggleSwitch } from "@/components/settings/ToggleSwitch";
import { SettingsNav, type SettingsCategoryId } from "@/components/settings/SettingsNav";
import { AuthToast, type AuthToastVariant } from "@/components/auth/AuthToast";
import {
  saveSettings,
  useSettings,
  useSettingsStatus,
  useSettingsError,
  retrySettings,
  type UserSettings,
} from "@/lib/settings";
import { settingsSchema } from "@/lib/validation/settings-schema";
import { formatZodError } from "@/lib/validation/format-zod-error";
import { categories } from "@/data/categories";

const languageOptions = [
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

const summaryLengthOptions: { value: UserSettings["summaryLength"]; label: string; description: string }[] = [
  { value: "short", label: "Short", description: "1-2 sentence highlights" },
  { value: "medium", label: "Medium", description: "A short paragraph" },
  { value: "long", label: "Long", description: "Detailed multi-paragraph summary" },
];

/**
 * Product polishing phase, 4th pass ("premium SaaS feel, only
 * news-platform-relevant settings retained"): dropped Dark Mode, Compact
 * View, Auto Play Videos, Public Profile, and Show Reading Activity -
 * every one of these was a purely decorative toggle wired to nothing
 * (no theme system, no compact layout variant, no video content
 * anywhere in the product, and no public-facing profile or activity
 * page for Privacy to actually govern). Shipping controls with no
 * effect is exactly what made this page read as a generic admin-panel
 * template rather than a page built for Virexa. What remains are only
 * settings that change something real: language, AI summary length,
 * preferred categories, notification/email preferences, and link
 * behavior.
 */
export function SettingsForm() {
  const [activeCategory, setActiveCategory] = useState<SettingsCategoryId>("general");
  const savedSettings = useSettings();
  const status = useSettingsStatus();
  const loadError = useSettingsError();
  const [settings, setSettings] = useState<UserSettings>(savedSettings);
  const [syncedSettings, setSyncedSettings] = useState<UserSettings>(savedSettings);
  const [toast, setToast] = useState<{ message: string; variant: AuthToastVariant } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Keep the local draft in sync whenever the underlying store updates
  // (initial load finishing, or a background refresh) - but only while
  // the user hasn't started editing away from what's saved, so an
  // in-flight edit is never clobbered by a refetch. Adjusting state
  // directly during render (React's recommended pattern for this, see
  // https://react.dev/learn/you-might-not-need-an-effect) rather than in
  // a `useEffect`, matching `ProfileEditForm`'s identical draft-sync.
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

  function toggleCategory(name: string) {
    setSettings((prev) => ({
      ...prev,
      preferredCategories: prev.preferredCategories.includes(name)
        ? prev.preferredCategories.filter((item) => item !== name)
        : [...prev.preferredCategories, name],
    }));
  }

  async function handleSave() {
    const result = settingsSchema.safeParse(settings);
    if (!result.success) {
      showToast(formatZodError(result.error), "error", 4000);
      return;
    }

    setIsSaving(true);
    try {
      await saveSettings(result.data);
      showToast("Settings saved!", "success");
    } catch {
      showToast("Couldn't save your settings. Please try again.", "error", 4000);
    } finally {
      setIsSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 text-base text-slate-500 shadow-sm">
        Loading your settings...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-200 bg-red-50/40 p-10 text-center shadow-sm">
        <p className="text-base font-medium text-red-600">{loadError ?? "Couldn't load your settings."}</p>
        <button
          type="button"
          onClick={() => void retrySettings()}
          className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      <SettingsNav active={activeCategory} onSelect={setActiveCategory} />

      <div className="min-w-0 space-y-6">
        {activeCategory === "general" && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">Language</h2>
              <div className="mt-4">
                <label htmlFor="settings-language" className="text-sm font-semibold text-slate-700">
                  Display Language
                </label>
                <select
                  id="settings-language"
                  value={settings.language}
                  onChange={(event) => setSettings((prev) => ({ ...prev, language: event.target.value }))}
                  className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white sm:max-w-xs"
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">Browsing</h2>
              <div className="mt-2 divide-y divide-slate-100">
                <ToggleSwitch
                  label="Open Links in New Tab"
                  description="Article and source links open in a new browser tab."
                  checked={settings.openLinksInNewTab}
                  onChange={(checked) => setSettings((prev) => ({ ...prev, openLinksInNewTab: checked }))}
                />
              </div>
            </section>
          </>
        )}

        {activeCategory === "reading" && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">AI Summary Length</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {summaryLengthOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                      settings.summaryLength === option.value
                        ? "border-[#2f67e8] bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="summary-length"
                        checked={settings.summaryLength === option.value}
                        onChange={() => setSettings((prev) => ({ ...prev, summaryLength: option.value }))}
                        className="accent-[#2f67e8]"
                      />
                      <span className="font-semibold text-slate-950">{option.label}</span>
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">{option.description}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">Preferred Categories</h2>
              <p className="mt-1 text-base text-slate-500">Choose the topics you want to see more of.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isSelected = settings.preferredCategories.includes(category.name);
                  return (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => toggleCategory(category.name)}
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

        {activeCategory === "notifications" && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">Notifications</h2>
              <div className="mt-2 divide-y divide-slate-100">
                <ToggleSwitch
                  label="Email Notifications"
                  description="Get important updates in your inbox."
                  checked={settings.notifications.email}
                  onChange={(checked) =>
                    setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, email: checked } }))
                  }
                />
                <ToggleSwitch
                  label="Push Notifications"
                  description="Get notified about breaking news."
                  checked={settings.notifications.push}
                  onChange={(checked) =>
                    setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, push: checked } }))
                  }
                />
                <ToggleSwitch
                  label="Weekly Digest"
                  description="A weekly summary of top stories."
                  checked={settings.notifications.weeklyDigest}
                  onChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, weeklyDigest: checked },
                    }))
                  }
                />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">Email Preferences</h2>
              <div className="mt-2 divide-y divide-slate-100">
                <ToggleSwitch
                  label="Product Updates"
                  description="News about new Virexa features."
                  checked={settings.emailPreferences.productUpdates}
                  onChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      emailPreferences: { ...prev.emailPreferences, productUpdates: checked },
                    }))
                  }
                />
                <ToggleSwitch
                  label="Account Activity"
                  description="Sign-ins and security-related alerts."
                  checked={settings.emailPreferences.accountActivity}
                  onChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      emailPreferences: { ...prev.emailPreferences, accountActivity: checked },
                    }))
                  }
                />
              </div>
            </section>
          </>
        )}

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2f67e8] text-base font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
