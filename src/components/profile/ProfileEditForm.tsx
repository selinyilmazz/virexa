"use client";

import { useState, type FormEvent } from "react";
import { AuthToast } from "@/components/auth/AuthToast";
import { saveProfile, useProfile, type UserProfile } from "@/lib/profile";
import { setSession, useSession } from "@/lib/auth";

const countryOptions = [
  "Türkiye",
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Canada",
  "Netherlands",
  "Spain",
  "Italy",
  "Other",
];

export function ProfileEditForm() {
  const profile = useProfile();
  const session = useSession();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [syncedProfile, setSyncedProfile] = useState<UserProfile>(profile);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (profile !== syncedProfile) {
    setSyncedProfile(profile);
    setDraft(profile);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveProfile(draft);
    if (session) {
      setSession({ ...session, name: draft.fullName, avatar: profile.avatar });
    }
    setToastMessage("Profile updated successfully!");
    setTimeout(() => setToastMessage(null), 2000);
  }

  return (
    <form onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {toastMessage && <AuthToast message={toastMessage} />}

      <h2 className="text-2xl font-bold tracking-tight text-slate-950">Edit Profile</h2>
      <p className="mt-1 text-base text-slate-500">Update your personal information.</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className="text-sm font-semibold text-slate-700">
            Full Name
          </label>
          <input
            id="profile-name"
            value={draft.fullName}
            onChange={(event) => setDraft((prev) => ({ ...prev, fullName: event.target.value }))}
            className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
          />
        </div>

        <div>
          <label htmlFor="profile-username" className="text-sm font-semibold text-slate-700">
            Username
          </label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</span>
            <input
              id="profile-username"
              value={draft.username}
              onChange={(event) => setDraft((prev) => ({ ...prev, username: event.target.value }))}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-4 text-base text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-email" className="text-sm font-semibold text-slate-700">
            Email
          </label>
          <input
            id="profile-email"
            value={draft.email}
            readOnly
            className="mt-1.5 h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 text-base text-slate-500 outline-none"
          />
        </div>

        <div>
          <label htmlFor="profile-country" className="text-sm font-semibold text-slate-700">
            Country
          </label>
          <select
            id="profile-country"
            value={draft.country}
            onChange={(event) => setDraft((prev) => ({ ...prev, country: event.target.value }))}
            className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
          >
            {countryOptions.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="profile-bio" className="text-sm font-semibold text-slate-700">
            Bio
          </label>
          <textarea
            id="profile-bio"
            value={draft.bio}
            onChange={(event) => setDraft((prev) => ({ ...prev, bio: event.target.value }))}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#2f67e8] px-8 text-base font-semibold text-white transition-colors hover:bg-[#2556c9]"
      >
        Save Changes
      </button>
    </form>
  );
}
