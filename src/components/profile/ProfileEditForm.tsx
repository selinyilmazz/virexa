"use client";

import { useState, type FormEvent } from "react";
import { AuthToast, type AuthToastVariant } from "@/components/auth/AuthToast";
import { saveProfile, useProfile, type UserProfile } from "@/lib/profile";
import { createProfileSchema } from "@/lib/validation/profile-schema";
import { formatZodError } from "@/lib/validation/format-zod-error";
import { countryOptions } from "@/data/countries";
import { useTranslations } from "@/i18n/i18n-provider";

export function ProfileEditForm() {
  const t = useTranslations();
  const profile = useProfile();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [syncedProfile, setSyncedProfile] = useState<UserProfile>(profile);
  const [toast, setToast] = useState<{ message: string; variant: AuthToastVariant } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (profile !== syncedProfile) {
    setSyncedProfile(profile);
    setDraft(profile);
  }

  function showToast(message: string, variant: AuthToastVariant, durationMs = 2500) {
    setToast({ message, variant });
    setTimeout(() => setToast(null), durationMs);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = createProfileSchema(t).safeParse({
      fullName: draft.fullName,
      username: draft.username,
      bio: draft.bio,
      country: draft.country,
    });
    if (!result.success) {
      showToast(formatZodError(result.error, t), "error", 4000);
      return;
    }

    setIsSaving(true);
    try {
      await saveProfile(result.data);
      showToast(t("profile.editForm.successToast"), "success");
    } catch {
      // `saveProfile` already rolled the local cache back to the
      // previous value - just tell the user it didn't persist.
      showToast(t("profile.editForm.errorToast"), "error", 4000);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSave(event)} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("profile.editForm.heading")}</h2>
      <p className="mt-1 text-base text-slate-500 dark:text-slate-400">{t("profile.editForm.subtitle")}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("profile.editForm.fullName")}
          </label>
          <input
            id="profile-name"
            value={draft.fullName}
            onChange={(event) => setDraft((prev) => ({ ...prev, fullName: event.target.value }))}
            className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 text-base text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
          />
        </div>

        <div>
          <label htmlFor="profile-username" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("profile.editForm.username")}
          </label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">@</span>
            <input
              id="profile-username"
              value={draft.username}
              onChange={(event) => setDraft((prev) => ({ ...prev, username: event.target.value }))}
              className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 pl-8 pr-4 text-base text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("profile.editForm.email")}
          </label>
          <input
            id="profile-email"
            value={draft.email}
            readOnly
            className="mt-1.5 h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-4 text-base text-slate-500 dark:text-slate-400 outline-none"
          />
        </div>

        <div>
          <label htmlFor="profile-country" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("profile.editForm.country")}
          </label>
          <select
            id="profile-country"
            value={draft.country}
            onChange={(event) => setDraft((prev) => ({ ...prev, country: event.target.value }))}
            className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 text-base text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
          >
            {countryOptions.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="profile-bio" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("profile.editForm.bio")}
          </label>
          <textarea
            id="profile-bio"
            value={draft.bio}
            onChange={(event) => setDraft((prev) => ({ ...prev, bio: event.target.value }))}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-base text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#2f67e8] px-8 text-base font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? t("profile.editForm.saving") : t("profile.editForm.save")}
      </button>
    </form>
  );
}
