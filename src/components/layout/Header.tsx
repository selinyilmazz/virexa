import Link from "next/link";
import { Suspense } from "react";
import { HeaderAuthArea } from "@/components/layout/HeaderAuthArea";
import { HeaderBookmarkLink } from "@/components/layout/HeaderBookmarkLink";
import { HeaderSearchInput } from "@/components/layout/HeaderSearchInput";
import { getServerTranslations } from "@/i18n/get-server-translations";

// Slugs are the stable, non-localized identifiers used in URLs
// (`/category/technology`) and as `nav.categories.*` translation keys -
// only the on-screen label is localized, the route never changes with
// locale.
const navigationSlugs = ["technology", "business", "ai", "games", "world"] as const;

export async function Header() {
  const { t } = await getServerTranslations();

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex min-h-24 max-w-[1920px] items-center gap-5 px-5 py-3 sm:px-8 xl:gap-10">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-[#2f67e8]"
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

        <form role="search" action="/search" method="GET" className="min-w-0 flex-1 xl:max-w-[550px]">
          <label htmlFor="site-search" className="sr-only">
            {t("nav.searchAria")}
          </label>
          <div className="flex h-14 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-5 shadow-md">
            <Suspense
              fallback={
                <input
                  id="site-search"
                  name="q"
                  type="search"
                  placeholder={t("nav.searchPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-500"
                />
              }
            >
              <HeaderSearchInput />
            </Suspense>
            <button type="submit" aria-label={t("nav.searchButtonAria")} className="flex shrink-0 items-center justify-center">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-7 w-7 shrink-0 text-slate-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </button>
          </div>
        </form>

        <nav aria-label="Primary navigation" className="hidden items-center gap-7 xl:flex">
          {navigationSlugs.map((slug) => (
            <Link
              key={slug}
              href={`/category/${slug}`}
              className="text-xl font-semibold text-black transition-colors hover:text-[#2f67e8]"
            >
              {t(`nav.categories.${slug}`)}
            </Link>
          ))}
          <Link
            href="/categories"
            className="text-xl font-semibold text-black transition-colors hover:text-[#2f67e8]"
          >
            {t("nav.more")}
          </Link>
        </nav>

        <HeaderBookmarkLink />

        <HeaderAuthArea />
      </div>
    </header>
  );
}
