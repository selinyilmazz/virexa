import Link from "next/link";
import { Suspense } from "react";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { HeaderAuthArea } from "@/components/layout/HeaderAuthArea";
import { HeaderBookmarkLink } from "@/components/layout/HeaderBookmarkLink";
import { HeaderMobileSearch } from "@/components/layout/HeaderMobileSearch";
import { HeaderNotifications } from "@/components/layout/HeaderNotifications";
import { HeaderSearchInput } from "@/components/layout/HeaderSearchInput";
import { MobileNav } from "@/components/layout/MobileNav";
import { getServerTranslations } from "@/i18n/get-server-translations";

/**
 * Header alignment redesign: a true 3-zone grid (`grid-cols-[1fr_auto_1fr]`)
 * instead of a `flex` row, specifically so the search bar is mathematically
 * centered in the FULL row width - not just centered in whatever space is
 * left over after the logo and the actions cluster (which used to pull
 * everything visually toward the left, since the actions cluster is
 * wider than the logo). Both edge tracks are equal `1fr` columns, so the
 * middle `auto` column (the search form) always sits dead-center
 * regardless of how wide the logo or the actions cluster happen to be -
 * `justify-self-start`/`justify-self-end` then pin the logo/actions to
 * their own track's edge even if that track ends up wider than its
 * content (same trick Linear/Vercel/Stripe headers use). The 3-column
 * grid switches on at `lg:` (1024px) - the exact breakpoint where the
 * full search bar itself starts rendering (see `HeaderMobileSearch`
 * below it in the DOM order).
 *
 * Responsive Navbar redesign: below `lg`, `HeaderBookmarkLink`,
 * `HeaderNotifications` and `HeaderAuthArea` in the right-side actions
 * cluster no longer disappear the way they used to (`hidden md:flex` on
 * all three, which meant nobody below 768px could sign in, bookmark, see
 * notifications, or reach their profile/logout - not "squeezed off
 * screen", literally never rendered). `HeaderNotifications`/
 * `HeaderAuthArea` now always render something (each adapts internally
 * via its own `lg:` classes - avatar-only below `lg`, full avatar+name
 * at `lg:` and up); only `HeaderBookmarkLink` stays desktop-only
 * (`lg:flex`), reachable below `lg` via the `MobileNav` drawer instead.
 * The hamburger (`MobileNav`) and icon-only mobile search
 * (`HeaderMobileSearch`) fill the gap left by the hidden full search bar
 * and hidden `CategoryNav` row below `lg`.
 *
 * UI cleanup pass: the moon/sun theme toggle (`HeaderThemeToggle`) was
 * removed from this actions cluster entirely - theme selection is a
 * secondary action that belongs in Settings -> Appearance (still fully
 * functional there, see `SettingsForm.tsx`), not the primary navbar. The
 * cluster's `gap-4 sm:gap-5` and `HeaderNotifications` bell absorb the
 * freed space, so the remaining icons/avatar stay visually balanced
 * rather than left stranded with a lopsided gap.
 *
 * `max-w-[1820px]` matches `page.tsx`'s own content container exactly
 * (was `1920px` - its own, different, un-matched value) - this row and
 * `CategoryNav` underneath now share the EXACT same content edge as the
 * rest of the page, not just each other.
 */
type HeaderProps = {
  /**
   * The unified Explorer's EFFECTIVE search query (real `q` param, or a
   * page's own locked default when none is set - e.g. `/cloud` always
   * has an effective query of "cloud") - lets this single header search
   * box visually reflect a page-level default query even before the
   * visitor has typed anything, exactly like it already reflects a real
   * `?q=` param on `/search`/`/news`. `undefined` everywhere else
   * (unrelated pages never pass this).
   */
  initialSearchQuery?: string;
};

export async function Header({ initialSearchQuery }: HeaderProps = {}) {
  const { t } = await getServerTranslations();

  return (
    <div className="sticky top-0 z-30">
      <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto grid max-w-[1820px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 sm:px-8 sm:gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          <div className="flex shrink-0 items-center gap-3 justify-self-start sm:gap-4">
            {/* Hamburger trigger only renders anything visible below `lg`
                (internal `lg:hidden`) - Responsive Navbar redesign. */}
            <MobileNav />
            <Link href="/" className="flex shrink-0 items-center gap-2 text-[#2f67e8]" aria-label={t("nav.logoAria")}>
              <svg aria-hidden="true" viewBox="0 0 64 56" className="h-10 w-12 sm:h-11 sm:w-13" fill="none">
                <path d="M3 4h16l14 26L47 4h14L38 52H24L3 4Z" fill="currentColor" />
                <path d="m35 18 7-13h13l-8 13H35Z" fill="currentColor" />
                <path d="M48 17h10v10H48zM55 3h7v7h-7z" fill="currentColor" />
              </svg>
              <span className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Virexa</span>
            </Link>
          </div>

          {/* Full search bar: `lg:` and up only. Below `lg` it's replaced
              by `HeaderMobileSearch`'s icon + fullscreen overlay in the
              actions cluster - a full-width bar has no room to live in
              the compact below-`lg` row alongside the hamburger and the
              always-reachable notifications/profile icons. */}
          <form
            role="search"
            action="/search"
            method="GET"
            className="hidden min-w-0 lg:block lg:w-[700px] lg:justify-self-center"
          >
            <label htmlFor="site-search" className="sr-only">
              {t("nav.searchAria")}
            </label>
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 shadow-sm transition-colors focus-within:border-[#2f67e8]/40 focus-within:bg-white focus-within:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:focus-within:bg-slate-900">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
              <Suspense
                fallback={
                  <input
                    id="site-search"
                    name="q"
                    type="search"
                    defaultValue={initialSearchQuery}
                    placeholder={t("nav.searchPlaceholder")}
                    className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                }
              >
                <HeaderSearchInput initialQuery={initialSearchQuery} />
              </Suspense>
              {/* Trailing, vertically-centered search icon (Search Bar UX
                  update) - replaces the old decorative "Ctrl K" badge.
                  Doubles as the real submit control (was a separate
                  `sr-only` button before) rather than adding a second,
                  redundant control. Heroicons `MagnifyingGlassIcon`
                  (outline, 24x24) path data, inlined like every other
                  icon in this header - no new icon-library dependency. */}
              <button
                type="submit"
                aria-label={t("nav.searchButtonAria")}
                className="flex shrink-0 items-center justify-center self-center text-slate-400 transition-colors hover:text-[#2f67e8] dark:text-slate-500 dark:hover:text-blue-400"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </button>
            </div>
          </form>

          {/* Actions cluster: Responsive Navbar redesign - every one of
              these now renders something at every breakpoint (each
              component handles its own internal `lg:`-gated visibility),
              instead of the old `hidden md:flex` gate on all three that
              made bookmarks/notifications/profile/sign-in completely
              unreachable below 768px. Bell + avatar sit right next to
              each other at every tier ("🔔 SY ▼" - Bildirim ve profil
              hizalaması). */}
          <div className="flex shrink-0 items-center justify-self-end gap-4 sm:gap-5 lg:gap-6">
            <HeaderMobileSearch initialSearchQuery={initialSearchQuery} />
            <HeaderBookmarkLink />
            <HeaderNotifications />
            <HeaderAuthArea />
          </div>
        </div>
      </header>

      {/* Category row stays a `lg:`-only, always-visible bar - below `lg`
          the same items live in `MobileNav`'s drawer instead (imported
          from the same `primaryNavItems` list, so the two can't drift). */}
      <div className="hidden lg:block">
        <CategoryNav />
      </div>
    </div>
  );
}
