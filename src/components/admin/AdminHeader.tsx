"use client";

import Image from "next/image";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/hooks/useAuth";
import { getAvatarUrl, getDisplayName } from "@/lib/supabase/utils";

/**
 * Top bar for the whole `/admin` area - deliberately separate from the
 * public site's `Header` (no search bar, no category nav, no bookmark
 * link) so the admin area is a visually self-contained shell ("Mevcut
 * site tasarımını etkilemeden ayrı bir layout kullansın"). Reads the
 * signed-in admin's name/avatar via the same `useAuth`/`getDisplayName`/
 * `getAvatarUrl` helpers the public `HeaderAuthArea` already uses - no
 * new auth plumbing.
 */
export function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Virexa</p>
        <p className="text-lg font-bold text-slate-950">Admin Dashboard</p>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
            <Image src={getAvatarUrl(user)} alt={getDisplayName(user)} fill unoptimized className="object-cover" />
          </span>
          <span className="hidden text-sm font-semibold text-slate-950 sm:inline">{getDisplayName(user)}</span>
          <LogoutButton className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Logout
          </LogoutButton>
        </div>
      )}
    </header>
  );
}
