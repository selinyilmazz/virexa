"use client";

import { useEffect, useState } from "react";
import { ToggleSwitch } from "@/components/settings/ToggleSwitch";
import { AuthToast } from "@/components/auth/AuthToast";
import { defaultSettings, loadSettings, saveSettings, type UserSettings } from "@/lib/settings";
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

export function SettingsForm() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // One-time client-only hydration of the saved draft from localStorage;
    // no external store subscription is needed since this form owns the only writer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(loadSettings());
  }, []);

  function toggleCategory(name: string) {
    setSettings((prev) => ({
      ...prev,
      preferredCategories: prev.preferredCategories.includes(name)
        ? prev.preferredCategories.filter((item) => item !== name)
        : [...prev.preferredCategories, name],
    }));
  }

  function handleSave() {
    saveSettings(settings);
    setToastMessage("Settings saved!");
    setTimeout(() => setToastMessage(null), 2000);
  }

  return (
    <div className="space-y-6">
      {toastMessage && <AuthToast message={toastMessage} />}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Appearance</h2>
        <div className="mt-2 divide-y divide-slate-100">
          <ToggleSwitch
            label="Dark Mode"
            description="Switch to a darker color theme."
            checked={settings.darkMode}
            onChange={(checked) => setSettings((prev) => ({ ...prev, darkMode: checked }))}
          />
          <ToggleSwitch
            label="Compact View"
            description="Show more content with tighter spacing."
            checked={settings.compactView}
            onChange={(checked) => setSettings((prev) => ({ ...prev, compactView: checked }))}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Language & Content</h2>

        <div className="mt-5">
          <label htmlFor="settings-language" className="text-sm font-semibold text-slate-700">
            Language
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

        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-700">AI Summary Length</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
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
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Browsing</h2>
        <div className="mt-2 divide-y divide-slate-100">
          <ToggleSwitch
            label="Auto Play Videos"
            description="Automatically play video previews in your feed."
            checked={settings.autoPlayVideos}
            onChange={(checked) => setSettings((prev) => ({ ...prev, autoPlayVideos: checked }))}
          />
          <ToggleSwitch
            label="Open Links in New Tab"
            description="Article and source links open in a new browser tab."
            checked={settings.openLinksInNewTab}
            onChange={(checked) => setSettings((prev) => ({ ...prev, openLinksInNewTab: checked }))}
          />
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
            label="Marketing Emails"
            description="Offers, tips and partner announcements."
            checked={settings.emailPreferences.marketingEmails}
            onChange={(checked) =>
              setSettings((prev) => ({
                ...prev,
                emailPreferences: { ...prev.emailPreferences, marketingEmails: checked },
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
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Privacy</h2>
        <div className="mt-2 divide-y divide-slate-100">
          <ToggleSwitch
            label="Public Profile"
            description="Allow others to view your profile page."
            checked={settings.privacy.publicProfile}
            onChange={(checked) =>
              setSettings((prev) => ({ ...prev, privacy: { ...prev.privacy, publicProfile: checked } }))
            }
          />
          <ToggleSwitch
            label="Show Reading Activity"
            description="Display your saved and read articles to others."
            checked={settings.privacy.showReadingActivity}
            onChange={(checked) =>
              setSettings((prev) => ({ ...prev, privacy: { ...prev.privacy, showReadingActivity: checked } }))
            }
          />
        </div>
      </section>

      <button
        type="button"
        onClick={handleSave}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2f67e8] text-base font-semibold text-white transition-colors hover:bg-[#2556c9] sm:w-auto sm:px-8"
      >
        Save Changes
      </button>
    </div>
  );
}
