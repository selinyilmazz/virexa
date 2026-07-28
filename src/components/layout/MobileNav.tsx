"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "@/i18n/i18n-provider";
import { isAdminUser } from "@/lib/admin/is-admin";
import { primaryNavItems } from "@/lib/layout/primary-nav-items";
import { getDisplayName } from "@/lib/supabase/utils";

const HOME_ICON = (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 10v9a1 1 0 0 0 1 1h3v-5.5h4V20h3a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Responsive Navbar redesign: the hamburger trigger + full drawer that
 * replaces `CategoryNav`'s always-visible row below `lg` (1024px). Before
 * this component existed, everything in the header's actions cluster
 * (`HeaderBookmarkLink`/`HeaderNotifications`/`HeaderAuthArea`) was
 * `hidden md:flex` - meaning below 768px there was no way to sign in,
 * bookmark, or reach a profile/logout at all, and `CategoryNav`'s 8
 * category pills had to fight for space in an already-cramped row. This
 * drawer gives every one of those destinations a real, always-reachable
 * home on small screens: primary categories at the top (same list
 * `CategoryNav` renders, imported from the shared
 * `lib/layout/primary-nav-items` module so the two can never drift), then
 * an account section mirroring the desktop dropdown's links, in the exact
 * order the redesign mockup specifies (Bookmarks, Profile, Settings).
 *
 * Only mounted below `lg:` (`lg:hidden` on the trigger button itself) -
 * `CategoryNav` remains the unchanged desktop experience at `lg:` and up.
 */
export function MobileNav() {
  const t = useTranslations();
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close on route change and lock body scroll while the drawer is open -
  // a fullscreen overlay whose backdrop still lets the page behind it
  // scroll reads as broken, not modern.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isAdmin = !isLoading && user ? isAdminUser(user) : false;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        aria-label={t("nav.menu")}
        className="flex shrink-0 items-center justify-center text-slate-600 transition-colors hover:text-[#2f67e8] lg:hidden dark:text-slate-300 dark:hover:text-blue-400"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>

      {/* Always mounted so the backdrop/panel can transition in/out
          instead of popping, same convention as `HeaderAuthArea`'s
          dropdown - inert (unreachable, invisible) while closed. */}
      <div className={`fixed inset-0 z-40 lg:hidden ${isOpen ? "" : "pointer-events-none"}`} aria-hidden={!isOpen}>
        <button
          type="button"
          tabIndex={isOpen ? 0 : -1}
          aria-label={t("common.close")}
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-slate-950/40 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}
        />

        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.menu")}
          className={`absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-white shadow-xl transition-transform duration-200 ease-out dark:bg-slate-900 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <span className="font-serif text-2xl font-semibold text-[#2f67e8]">Virexa</span>
            <button
              type="button"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => setIsOpen(false)}
              aria-label={t("nav.closeMenu")}
              className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {!isLoading && user && (
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <UserAvatar user={user} sizeClassName="size-11" textClassName="text-base" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-base font-semibold text-slate-950 dark:text-white">{getDisplayName(user)}</p>
                  {isAdmin && (
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#2f67e8] dark:bg-blue-950/40 dark:text-blue-400">
                      {t("nav.adminBadge")}
                    </span>
                  )}
                </div>
                {user.email && <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>}
              </div>
            </div>
          )}

          <nav className="flex flex-1 flex-col gap-1 px-3 py-3">
            <DrawerLink href="/" label={t("nav.home")} icon={HOME_ICON} tabIndex={isOpen ? 0 : -1} pathname={pathname} />
            {primaryNavItems.map((item) => (
              <DrawerLink
                key={item.href}
                href={item.href}
                label={t(item.labelKey)}
                icon={item.icon}
                tabIndex={isOpen ? 0 : -1}
                pathname={pathname}
              />
            ))}

            <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />

            {!isLoading && user ? (
              <>
                <DrawerLink href="/bookmarks" label={t("nav.bookmarks")} icon={BOOKMARK_ICON} tabIndex={isOpen ? 0 : -1} pathname={pathname} />
                <DrawerLink href="/profile" label={t("nav.profile")} icon={PROFILE_ICON} tabIndex={isOpen ? 0 : -1} pathname={pathname} />
                <DrawerLink href="/settings" label={t("nav.settings")} icon={SETTINGS_ICON} tabIndex={isOpen ? 0 : -1} pathname={pathname} />
                {isAdmin && (
                  <DrawerLink href="/admin" label={t("nav.adminPanel")} icon={ADMIN_ICON} tabIndex={isOpen ? 0 : -1} pathname={pathname} />
                )}

                <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />

                <LogoutButton
                  onBeforeNavigate={() => setIsOpen(false)}
                  tabIndex={isOpen ? 0 : -1}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-base font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t("nav.logout")}
                </LogoutButton>
              </>
            ) : (
              !isLoading && (
                <div className="flex flex-col gap-2 px-1 pt-1">
                  <Link
                    href="/signin"
                    tabIndex={isOpen ? 0 : -1}
                    onClick={() => setIsOpen(false)}
                    className="rounded-2xl border-2 border-slate-300 px-4 py-2.5 text-center text-base font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                  >
                    {t("nav.signIn")}
                  </Link>
                  <Link
                    href="/signup"
                    tabIndex={isOpen ? 0 : -1}
                    onClick={() => setIsOpen(false)}
                    className="rounded-2xl bg-[#2f67e8] px-4 py-2.5 text-center text-base font-semibold text-white transition-colors hover:bg-[#2556c9]"
                  >
                    {t("nav.signUp")}
                  </Link>
                </div>
              )
            )}
          </nav>
        </div>
      </div>
    </>
  );
}

const BOOKMARK_ICON = (
  <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
  </svg>
);

const PROFILE_ICON = (
  <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7" strokeLinecap="round" />
  </svg>
);

const SETTINGS_ICON = (
  <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3" />
    <path
      d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ADMIN_ICON = (
  <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path
      d="M14.7 3.3a3 3 0 0 0-4.2 4.2l-7 7a2 2 0 1 0 2.8 2.8l7-7a3 3 0 0 0 4.2-4.2l-2.3 2.3-2-2 2.3-2.3Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type DrawerLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
  tabIndex: number;
  pathname: string;
};

function DrawerLink({ href, label, icon, tabIndex, pathname }: DrawerLinkProps) {
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  return (
    <Link
      href={href}
      tabIndex={tabIndex}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-colors ${
        isActive
          ? "bg-blue-50 text-[#2f67e8] dark:bg-blue-950/40 dark:text-blue-400"
          : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
