"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";
import { clearBookmarks } from "@/lib/bookmarks";
import { resetProfile } from "@/lib/profile";
import { resetSettings } from "@/lib/settings";

export function DangerZoneCard() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    clearBookmarks();
    resetProfile();
    resetSettings();
    clearSession();
    router.push("/");
  }

  return (
    <div className="rounded-3xl border border-red-200 bg-red-50/40 p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-bold tracking-tight text-red-600">Danger Zone</h2>
      <p className="mt-1 text-base text-slate-500">
        Deleting your account permanently clears your saved articles, profile and preferences from this device.
      </p>
      <button
        type="button"
        onClick={handleDelete}
        onBlur={() => setConfirming(false)}
        className={`mt-5 flex h-12 items-center justify-center gap-2 rounded-xl border px-6 text-base font-semibold transition-colors ${
          confirming
            ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
            : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
        }`}
      >
        {confirming ? "Click again to confirm delete" : "Delete Account"}
      </button>
    </div>
  );
}
