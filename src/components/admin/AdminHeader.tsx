"use client";

import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/hooks/useAuth";
import { getAvatarUrl, getDisplayName } from "@/lib/supabase/utils";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminHeaderSearch } from "@/components/admin/AdminHeaderSearch";
import { NotificationsBell } from "@/components/admin/NotificationsBell";

/**
 * Top bar for the whole `/admin` area - deliberately separate from the
 * public site's `Header` (no category nav, no bookmark link) so the
 * admin area is a visually self-contained shell.
 *
 * Admin Panel Redesign: now a real SaaS-dashboard topbar (requirement 3)
 * instead of just a title + avatar - left-to-right: mobile hamburger
 * (`AdminMobileNav`, hidden on desktop where `AdminSidebar` already
 * covers navigation), a "Back to Website" button (requirement 13 - top
 * left, returns home), the page title, a global search box
 * (`AdminHeaderSearch`, requirement 14), the notifications bell
 * (`NotificationsBell`, real health/runtime/audit alerts - never
 * fabricated), the signed-in admin's avatar/name (unchanged, same
 * `useAuth`/`getDisplayName`/`getAvatarUrl` helpers the public
 * `HeaderAuthArea` already uses), and Logout.
 */
export function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="flex h-20 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <AdminMobileNav />

      <Link
        href="/"
        className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:flex"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Website
      </Link>

      <div className="hidden shrink-0 sm:block">
        <p className="text-sm font-medium text-slate-500">Virexa</p>
        <p className="text-lg font-bold text-slate-950">Admin</p>
      </div>

      <div className="min-w-0 flex-1" />

      <AdminHeaderSearch />

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationsBell />

        {user && (
          <>
            <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
              <Image src={getAvatarUrl(user)} alt={getDisplayName(user)} fill unoptimized className="object-cover" />
            </span>
            <span className="hidden text-sm font-semibold text-slate-950 lg:inline">{getDisplayName(user)}</span>
            <LogoutButton className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
              Logout
            </LogoutButton>
          </>
        )}
      </div>
    </header>
  );
}
