import Link from "next/link";
import { Suspense } from "react";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { HeaderAuthArea } from "@/components/layout/HeaderAuthArea";
import { HeaderBookmarkLink } from "@/components/layout/HeaderBookmarkLink";
import { HeaderNotifications } from "@/components/layout/HeaderNotifications";
import { HeaderSearchInput } from "@/components/layout/HeaderSearchInput";
import { getServerTranslations } from "@/i18n/get-server-translations";

/** Authenticated navbar redesign - premium Linear/GitHub-style search placeholder. Ctrl/Cmd+K still focuses this field (see `HeaderSearchInput`'s doc comment) - only the visible "Ctrl K" badge was removed (Search Bar UX update), replaced by a trailing search icon. */
const SEARCH_PLACEHOLDER = "Search articles, releases, repositories, technologies...";

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
 * grid switches on at `md:` (768px) specifically because that's the
 * exact breakpoint where the right-side actions (`HeaderBookmarkLink`/
 * `HeaderAuthArea`, each `hidden md:flex`) start rendering anything at
 * all - below that, true 1fr/1fr centering would needlessly reserve
 * space in an empty right column instead of letting the search bar use
 * it.
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
        <div className="mx-auto grid max-w-[1820px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 sm:px-8 sm:gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 justify-self-start text-[#2f67e8]"
            aria-label={t("nav.logoAria")}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 64 56"
              className="h-10 w-12 sm:h-11 sm:w-13"
              fill="none"
            >
              <path d="M3 4h16l14 26L47 4h14L38 52H24L3 4Z" fill="currentColor" />
              <path d="m35 18 7-13h13l-8 13H35Z" fill="currentColor" />
              <path d="M48 17h10v10H48zM55 3h7v7h-7z" fill="currentColor" />
            </svg>
            <span className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Virexa
            </span>
          </Link>

          <form
            role="search"
            action="/search"
            method="GET"
            className="min-w-0 w-full max-w-[420px] justify-self-stretch sm:max-w-[500px] md:w-[650px] md:max-w-none md:justify-self-center lg:w-[700px]"
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
                    placeholder={SEARCH_PLACEHOLDER}
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

          <div className="flex shrink-0 items-center justify-self-end gap-5 sm:gap-6">
            <HeaderBookmarkLink />
            <HeaderNotifications />
            <HeaderAuthArea />
          </div>
        </div>
      </header>

      <CategoryNav />
    </div>
  );
}
