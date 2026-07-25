"use client";

import { useState } from "react";
import { AuthToast, type AuthToastVariant } from "@/components/auth/AuthToast";
import { clearBookmarks, getBookmarks } from "@/lib/bookmarks";
import { clearReadingHistory, getReadingHistory } from "@/lib/reading-history";
import { getProfile } from "@/lib/profile";
import { getSettings, saveSettings, useSettings } from "@/lib/settings";
import { ToggleSwitch } from "@/components/settings/ToggleSwitch";
import { DangerZoneCard } from "@/components/profile/DangerZoneCard";
import { useTranslations } from "@/i18n/i18n-provider";

type ActionRowProps = {
  title: string;
  description: string;
  actionLabel: string;
  confirmLabel: string;
  confirming: boolean;
  onClick: () => void;
  onCancelConfirm: () => void;
};

function ActionRow({ title, description, actionLabel, confirmLabel, confirming, onClick, onCancelConfirm }: ActionRowProps) {
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
        {confirming ? confirmLabel : actionLabel}
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
  const t = useTranslations();
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
      showToast(t("settings.privacy.privacyErrorToast"), "error", 4000)
    );
  }

  function handleClearHistory() {
    if (!confirmingHistory) {
      setConfirmingHistory(true);
      return;
    }
    setConfirmingHistory(false);
    clearReadingHistory()
      .then(() => showToast(t("settings.privacy.clearHistoryToast"), "success"))
      .catch(() => showToast(t("settings.privacy.clearHistoryErrorToast"), "error", 4000));
  }

  function handleClearBookmarks() {
    if (!confirmingBookmarks) {
      setConfirmingBookmarks(true);
      return;
    }
    setConfirmingBookmarks(false);
    clearBookmarks()
      .then(() => showToast(t("settings.privacy.clearBookmarksToast"), "success"))
      .catch(() => showToast(t("settings.privacy.clearBookmarksErrorToast"), "error", 4000));
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
    showToast(t("settings.privacy.exportToast"), "success");
  }

  const visibilityOptions: { value: "private" | "public"; labelKey: string }[] = [
    { value: "private", labelKey: "settings.privacy.visibilityPrivate" },
    { value: "public", labelKey: "settings.privacy.visibilityPublic" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("settings.privacy.prefsTitle")}</h2>
        <p className="mt-1 text-base text-slate-500 dark:text-slate-400">{t("settings.privacy.prefsDescription")}</p>

        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("settings.privacy.visibilityLabel")}</p>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t("settings.privacy.visibilityDescription")}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {visibilityOptions.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-2xl border p-4 text-center transition-colors ${
                  settings.privacy.profileVisibility === option.value
                    ? "border-[#2f67e8] bg-blue-50 dark:bg-blue-950/40"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="profile-visibility"
                  className="sr-only"
                  checked={settings.privacy.profileVisibility === option.value}
                  onChange={() => updatePrivacy({ profileVisibility: option.value })}
                />
                <span className="font-semibold text-slate-950 dark:text-white">{t(option.labelKey)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          <ToggleSwitch
            label={t("settings.privacy.analyticsLabel")}
            description={t("settings.privacy.analyticsDescription")}
            checked={settings.privacy.analyticsConsent}
            onChange={(checked) => updatePrivacy({ analyticsConsent: checked })}
          />
          <ToggleSwitch
            label={t("settings.privacy.recommendationsLabel")}
            description={t("settings.privacy.recommendationsDescription")}
            checked={settings.privacy.personalizedRecommendations}
            onChange={(checked) => updatePrivacy({ personalizedRecommendations: checked })}
          />
          <ToggleSwitch
            label={t("settings.privacy.searchHistoryLabel")}
            description={t("settings.privacy.searchHistoryDescription")}
            checked={settings.privacy.trackSearchHistory}
            onChange={(checked) => updatePrivacy({ trackSearchHistory: checked })}
          />
          <ToggleSwitch
            label={t("settings.privacy.readingHistoryLabel")}
            description={t("settings.privacy.readingHistoryDescription")}
            checked={settings.privacy.trackReadingHistory}
            onChange={(checked) => updatePrivacy({ trackReadingHistory: checked })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("settings.privacy.dataTitle")}</h2>
        <p className="mt-1 text-base text-slate-500 dark:text-slate-400">{t("settings.privacy.dataDescription")}</p>

        <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          <ActionRow
            title={t("settings.privacy.clearHistoryTitle")}
            description={t("settings.privacy.clearHistoryDescription")}
            actionLabel={t("settings.privacy.clearHistoryAction")}
            confirmLabel={t("settings.privacy.confirmAgain")}
            confirming={confirmingHistory}
            onClick={handleClearHistory}
            onCancelConfirm={() => setConfirmingHistory(false)}
          />
          <ActionRow
            title={t("settings.privacy.clearBookmarksTitle")}
            description={t("settings.privacy.clearBookmarksDescription")}
            actionLabel={t("settings.privacy.clearBookmarksAction")}
            confirmLabel={t("settings.privacy.confirmAgain")}
            confirming={confirmingBookmarks}
            onClick={handleClearBookmarks}
            onCancelConfirm={() => setConfirmingBookmarks(false)}
          />
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">{t("settings.privacy.exportTitle")}</p>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t("settings.privacy.exportDescription")}</p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {t("settings.privacy.exportAction")}
            </button>
          </div>
        </div>
      </section>

      <DangerZoneCard />
    </div>
  );
}
