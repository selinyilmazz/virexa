"use client";

import Link from "next/link";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { useProfile } from "@/lib/profile";

/**
 * Profile page "PROFILE HERO" (redesign) - large avatar, full name, email,
 * member since, country, and a primary "Edit Profile" action. The button
 * links to the Settings page's Account category (`/settings?category=account`)
 * rather than embedding a second copy of the edit form here - editing
 * fields and settings now live in exactly one place (Settings), so the
 * two pages can never drift out of sync.
 */
export function ProfileHeader() {
  const profile = useProfile();

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
        <ProfileAvatarUpload />

        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{profile.fullName}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium text-slate-400 dark:text-slate-500 sm:justify-start">
            <span>Member since {profile.joinDate}</span>
            <span aria-hidden="true">·</span>
            <span>{profile.country || "Location not set"}</span>
          </div>
        </div>

        <Link
          href="/settings?category=account"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#2f67e8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2556c9]"
        >
          Edit Profile
        </Link>
      </div>
    </div>
  );
}
