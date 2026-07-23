"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/hooks/useAuth";
import { getAvatarUrl, getDisplayName } from "@/lib/supabase/utils";
import { useTranslations } from "@/i18n/i18n-provider";
import { isAdminUser } from "@/lib/admin/is-admin";

// Reading History and Developer Releases moved from Profile-tab/Developer
// Hub sub-page deep links to their own standalone top-level routes
// (Navigation/Profile/Settings UX update) - the Profile page itself now
// only shows overview/stats, so this dropdown is the one place all five
// authenticated destinations are reachable from.
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
    href: "/reading-history",
    label: "Reading History",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    // Points straight at the canonical listing now (stabilization pass) -
    // the old standalone `/developer-releases` route redirects here too,
    // but linking directly avoids an unnecessary redirect hop from this
    // primary nav surface.
    href: "/developer-hub/releases",
    label: "Developer Releases",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v10M12 13l4-4M12 13 8 9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
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
    return <div className="hidden shrink-0 items-center gap-3 md:flex" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <div className="hidden shrink-0 items-center gap-3 md:flex">
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
    );
  }

  const displayName = getDisplayName(user);
  const avatarUrl = getAvatarUrl(user);
  // Reads the same `app_metadata.role` field `middleware.ts`/`is-admin.ts`
  // trust for the real `/admin` gate - this is purely a UI convenience
  // (hide the link from users who'd just get redirected away), not a
  // second source of truth, so a non-admin can never see it change
  // anything security-relevant.
  const isAdmin = isAdminUser(user);

  return (
    <div ref={containerRef} className="relative hidden shrink-0 items-center md:flex">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2.5 rounded-2xl border border-slate-200 px-3 py-2 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
          <Image src={avatarUrl} alt={displayName} fill unoptimized className="object-cover" />
        </span>
        <span className="max-w-[140px] truncate text-lg font-semibold text-slate-950 dark:text-white">{displayName}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`size-4 shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${isOpen ? "rotate-180" : ""}`}
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
        className={`absolute right-0 top-full z-20 mt-2 w-56 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-lg transition-all duration-150 ease-out dark:border-slate-700 dark:bg-slate-900 ${
          isOpen ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0 pointer-events-none"
        }`}
      >
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
              {"label" in item ? item.label : t(item.labelKey)}
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
              <span aria-hidden="true" className="text-lg leading-none">
                🛠
              </span>
              Admin Panel
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
