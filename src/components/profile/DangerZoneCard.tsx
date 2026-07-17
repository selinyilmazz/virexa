"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearBookmarks } from "@/lib/bookmarks";
import { resetProfile } from "@/lib/profile";
import { resetSettings } from "@/lib/settings";

export function DangerZoneCard() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    // Full account deletion (removing the auth.users row, which cascades
    // to profiles/bookmarks/user_settings via the FKs in the migration)
    // requires the Supabase service role key (admin API) and is
    // deferred to a follow-up task. For now this clears the local
    // caches and signs the user out for real - `clearBookmarks()` also
    // deletes the rows server-side, so nothing stale is left to reload
    // on next sign-in even though full account deletion isn't wired up
    // yet.
    clearBookmarks().catch((error) => {
      console.error("[DangerZoneCard] Failed to clear bookmarks before account reset:", error);
    });
    resetProfile();
    resetSettings();

    const supabase = createClient();
    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  return (
    <div className="rounded-3xl border border-red-200 bg-red-50/40 p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-bold tracking-tight text-red-600">Danger Zone</h2>
      <p className="mt-1 text-base text-slate-500">
        Deleting your account permanently clears your saved articles, profile and preferences from this device.
      </p>
      <button
        type="button"
        onClick={() => void handleDelete()}
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
