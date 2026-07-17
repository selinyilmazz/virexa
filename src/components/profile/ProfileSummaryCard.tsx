"use client";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { useProfile } from "@/lib/profile";

export function ProfileSummaryCard() {
  const profile = useProfile();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <ProfileAvatarUpload />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">{profile.fullName}</h1>
      <p className="mt-1 text-base text-slate-500">{profile.email}</p>
      {profile.bio && <p className="mt-3 text-sm leading-relaxed text-slate-500">{profile.bio}</p>}

      <LogoutButton className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-base font-semibold text-red-600 transition-colors hover:bg-red-100">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Log Out
      </LogoutButton>
    </div>
  );
}
