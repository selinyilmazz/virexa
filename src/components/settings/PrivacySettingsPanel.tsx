"use client";

import { useState } from "react";
import { AuthToast, type AuthToastVariant } from "@/components/auth/AuthToast";
import { clearBookmarks, getBookmarks } from "@/lib/bookmarks";
import { clearReadingHistory, getReadingHistory } from "@/lib/reading-history";
import { getProfile } from "@/lib/profile";
import { getSettings, saveSettings, useSettings } from "@/lib/settings";
import { ToggleSwitch } from "@/components/settings/ToggleSwitch";
import { DangerZoneCard } from "@/components/profile/DangerZoneCard";

type ActionRowProps = {
  title: string;
  description: string;
  actionLabel: string;
  confirming: boolean;
  onClick: () => void;
  onCancelConfirm: () => void;
};

function ActionRow({ title, description, actionLabel, confirming, onClick, onCancelConfirm }: ActionRowProps) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        onBlur={onCancelConfirm}
        className={`inline-flex shrink-0 items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
          confirming
            ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        {confirming ? "Click again to confirm" : actionLabel}
      </button>
    </div>
  );
}

/**
 * Settings page "PRIVACY" category (redesign): Clear Reading History,
 * Clear Bookmarks, and Export Data as immediate actions (no draft/Save
 * Changes button - each button acts right away, same pattern as the
 * existing `DangerZoneCard`'s two-click confirm), with Delete Account
 * rendered via the real, unmodified `DangerZoneCard` below in its own
 * visually separated red card, per the spec's "Danger Zone should be
 * visually separated" requirement.
 */
export function PrivacySettingsPanel() {
  const settings = useSettings();
  const [confirmingHistory, setConfirmingHistory] = useState(false);
  const [confirmingBookmarks, setConfirmingBookmarks] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: AuthToastVariant } | null>(null);

  function showToast(message: string, variant: AuthToastVariant, durationMs = 2500) {
    setToast({ message, variant });
    setTimeout(() => setToast(null), durationMs);
  }

  // Each privacy toggle saves immediately on change (no separate "Save
  // Changes" button here, same immediate-action convention already used
  // for Clear History/Clear Bookmarks below) rather than batching into a
  // draft - these are consent-style preferences a user expects to take
  // effect the moment they're changed.
  function updatePrivacy(patch: Partial<typeof settings.privacy>) {
    saveSettings({ ...settings, privacy: { ...settings.privacy, ...patch } }).catch(() =>
      showToast("Couldn't save your privacy preference. Please try again.", "error", 4000)
    );
  }

  function handleClearHistory() {
    if (!confirmingHistory) {
      setConfirmingHistory(true);
      return;
    }
    setConfirmingHistory(false);
    clearReadingHistory()
      .then(() => showToast("Reading history cleared.", "success"))
      .catch(() => showToast("Couldn't clear your reading history. Please try again.", "error", 4000));
  }

  function handleClearBookmarks() {
    if (!confirmingBookmarks) {
      setConfirmingBookmarks(true);
      return;
    }
    setConfirmingBookmarks(false);
    clearBookmarks()
      .then(() => showToast("Bookmarks cleared.", "success"))
      .catch(() => showToast("Couldn't clear your bookmarks. Please try again.", "error", 4000));
  }

  function handleExportData() {
    // A real, honest export of exactly what's actually loaded in this
    // session's client caches (profile/settings/bookmarks/reading
    // history) - no fabricated fields, no data the user can't already
    // see elsewhere in the product.
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: getProfile(),
      settings: getSettings(),
      bookmarks: getBookmarks(),
      readingHistory: getReadingHistory(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "virexa-data-export.json";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Your data export has started downloading.", "success");
  }

  return (
    <div className="flex flex-col gap-8">
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Privacy Preferences</h2>
        <p className="mt-1 text-base text-slate-500 dark:text-slate-400">Control what Virexa tracks and shows about your account. Saves immediately.</p>

        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Profile Visibility</p>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Whether other signed-in users can see your public profile page.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(["private", "public"] as const).map((value) => (
              <label
                key={value}
                className={`cursor-pointer rounded-2xl border p-4 text-center capitalize transition-colors ${
                  settings.privacy.profileVisibility === value
                    ? "border-[#2f67e8] bg-blue-50 dark:bg-blue-950/40"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="profile-visibility"
                  className="sr-only"
                  checked={settings.privacy.profileVisibility === value}
                  onChange={() => updatePrivacy({ profileVisibility: value })}
                />
                <span className="font-semibold text-slate-950 dark:text-white">{value}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          <ToggleSwitch
            label="Analytics Consent"
            description="Allow Virexa to collect anonymous usage analytics to improve the product."
            checked={settings.privacy.analyticsConsent}
            onChange={(checked) => updatePrivacy({ analyticsConsent: checked })}
          />
          <ToggleSwitch
            label="Personalized Recommendations"
            description="Use your reading activity to personalize recommended articles."
            checked={settings.privacy.personalizedRecommendations}
            onChange={(checked) => updatePrivacy({ personalizedRecommendations: checked })}
          />
          <ToggleSwitch
            label="Save Search History"
            description="Keep a record of what you search for on Virexa."
            checked={settings.privacy.trackSearchHistory}
            onChange={(checked) => updatePrivacy({ trackSearchHistory: checked })}
          />
          <ToggleSwitch
            label="Save Reading History"
            description="Keep a record of the articles you open."
            checked={settings.privacy.trackReadingHistory}
            onChange={(checked) => updatePrivacy({ trackReadingHistory: checked })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Your Data</h2>
        <p className="mt-1 text-base text-slate-500 dark:text-slate-400">Manage the data Virexa has saved for your account.</p>

        <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          <ActionRow
            title="Clear Reading History"
            description="Permanently remove your read-article history from this account."
            actionLabel="Clear History"
            confirming={confirmingHistory}
            onClick={handleClearHistory}
            onCancelConfirm={() => setConfirmingHistory(false)}
          />
          <ActionRow
            title="Clear Bookmarks"
            description="Remove every saved article, release and repository bookmark."
            actionLabel="Clear Bookmarks"
            confirming={confirmingBookmarks}
            onClick={handleClearBookmarks}
            onCancelConfirm={() => setConfirmingBookmarks(false)}
          />
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">Export Data</p>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Download your profile, settings, bookmarks and reading history as a JSON file.</p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Export Data
            </button>
          </div>
        </div>
      </section>

      <DangerZoneCard />
    </div>
  );
}
