"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { getDisplayName } from "@/lib/supabase/utils";
import { useTranslations } from "@/i18n/i18n-provider";
import { isAdminUser } from "@/lib/admin/is-admin";

// User Menu redesign: trimmed from 5 links down to the 3 the mockup asks
// for (Profile, Bookmarks, Settings). "Reading History" remains reachable
// from the Profile page's own stats section, and "Developer Releases" has
// its own top-level `CategoryNav`/mobile-drawer entry ("Developer Hub") -
// neither needs a second, redundant entry point buried in this dropdown.
const dropdownLinks = [
  {
    href: "/profile",
    labelKey: "nav.profile",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/bookmarks",
    labelKey: "nav.bookmarks",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
      </svg>
    ),
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

/**
 * Signed-out trigger, outline "person" glyph (Lucide `CircleUserRound`
 * reference from the mockup, hand-drawn inline like every other icon in
 * this header rather than adding a new icon-library dependency). Only
 * shown below `lg` (see the `flex lg:hidden` wrapper at the call site) -
 * the full "Sign In"/"Sign Up" buttons still render at `lg:` and up.
 */
function SignedOutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.4 19a6 6 0 0 1 11.2 0" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Responsive Navbar + User Menu redesign: this single component now
 * covers BOTH the full desktop trigger (avatar + name + chevron) and the
 * compact mobile/tablet trigger (avatar only) via Tailwind breakpoints
 * instead of two separately-mounted components - the trigger's inner
 * pieces (name text, chevron) are individually `hidden lg:*`, so there's
 * exactly one `<button>`/dropdown/focus-trap to keep in sync, not two.
 * Stabilization pass: previously this whole component (signed-in AND
 * signed-out branches) was `hidden md:flex`, meaning nobody below 768px
 * could sign in, sign up, or reach their profile/logout at all - it's
 * now always mounted, and responsiveness is handled entirely by the
 * classes on its children.
 */
export function HeaderAuthArea() {
  const t = useTranslations();
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (isLoading) {
    // Server-resolved auth state normally lands before first paint (see
    // AuthProvider), so this is a brief defensive placeholder rather
    // than a real loading state - reserves the same layout slot so
    // nothing shifts once resolved.
    return <div className="flex shrink-0 items-center gap-3" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <div className="flex shrink-0 items-center gap-3">
        <Link href="/signin" aria-label={t("nav.signInAria")} className="flex items-center text-slate-500 transition-colors hover:text-[#2f67e8] lg:hidden dark:text-slate-400 dark:hover:text-blue-400">
          <SignedOutIcon />
        </Link>
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/signin"
            className="rounded-2xl border-2 border-slate-300 px-6 py-2 text-xl font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
          >
            {t("nav.signIn")}
          </Link>
          <Link
            href="/signup"
            className="rounded-2xl bg-[#2f67e8] px-6 py-2 text-xl font-semibold text-white transition-colors hover:bg-[#2556c9]"
          >
            {t("nav.signUp")}
          </Link>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(user);
  // Reads the same `app_metadata.role` field `middleware.ts`/`is-admin.ts`
  // trust for the real `/admin` gate - this is purely a UI convenience
  // (hide the link from users who'd just get redirected away), not a
  // second source of truth, so a non-admin can never see it change
  // anything security-relevant.
  const isAdmin = isAdminUser(user);

  return (
    <div ref={containerRef} className="relative flex shrink-0 items-center">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t("nav.accountMenuAria")}
        className="flex items-center gap-2.5 rounded-2xl border border-transparent px-1 py-1 transition-colors hover:bg-slate-50 lg:border-slate-200 lg:px-3 lg:py-2 dark:lg:border-slate-700 dark:hover:bg-slate-800"
      >
        <UserAvatar user={user} />
        <span className="hidden max-w-[140px] truncate text-lg font-semibold text-slate-950 lg:inline dark:text-white">
          {displayName}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`hidden size-4 shrink-0 text-slate-500 transition-transform lg:block dark:text-slate-400 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Always mounted (never conditionally rendered) so opacity/scale can
          actually transition instead of popping in/out instantly -
          `pointer-events-none` + `invisible` keep it fully inert while
          closed (unreachable by mouse or keyboard tab order). */}
      <div
        role="menu"
        aria-hidden={!isOpen}
        className={`absolute right-0 top-full z-20 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-lg transition-all duration-150 ease-out dark:border-slate-700 dark:bg-slate-900 ${
          isOpen ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0 pointer-events-none"
        }`}
      >
        {/* Identity header: avatar/photo (or initials) + name + email, so
            the dropdown reads like an account panel rather than just a
            plain link list (User Menu redesign - "Profil bilgisi üstte"). */}
        <div className="flex items-center gap-3 px-2 py-2.5">
          <UserAvatar user={user} sizeClassName="size-11" textClassName="text-base" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-semibold text-slate-950 dark:text-white">{displayName}</p>
              {isAdmin && (
                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#2f67e8] dark:bg-blue-950/40 dark:text-blue-400">
                  {t("nav.adminBadge")}
                </span>
              )}
            </div>
            {user.email && <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>}
          </div>
        </div>

        <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

        {dropdownLinks.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-[#2f67e8] dark:bg-blue-950/40 dark:text-blue-400"
                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {item.icon}
              {t(item.labelKey)}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
            <Link
              href="/admin"
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path
                  d="M14.7 3.3a3 3 0 0 0-4.2 4.2l-7 7a2 2 0 1 0 2.8 2.8l7-7a3 3 0 0 0 4.2-4.2l-2.3 2.3-2-2 2.3-2.3Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t("nav.adminPanel")}
            </Link>
          </>
        )}

        <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

        <LogoutButton
          onBeforeNavigate={() => setIsOpen(false)}
          tabIndex={isOpen ? 0 : -1}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-base font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("nav.logout")}
        </LogoutButton>
      </div>
    </div>
  );
}
