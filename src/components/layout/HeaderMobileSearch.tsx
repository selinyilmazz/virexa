"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HeaderSearchInput } from "@/components/layout/HeaderSearchInput";
import { useTranslations } from "@/i18n/i18n-provider";

const SEARCH_PLACEHOLDER = "Search articles, releases, repositories, technologies...";

type HeaderMobileSearchProps = {
  initialSearchQuery?: string;
};

/**
 * Responsive Search (navbar redesign): below `lg`, the full-width desktop
 * search bar is replaced by this single icon button - tapping it opens a
 * fullscreen overlay with a real, roomy input instead of the same bar
 * squeezed into a few dozen pixels of a compact header row. Uses its own
 * `"site-search-mobile"` id (via `HeaderSearchInput`'s new `id` prop) so
 * this overlay's input and the desktop bar's `"site-search"` input never
 * collide, even though both are always mounted (the desktop one just sits
 * `hidden` below `lg`).
 */
export function HeaderMobileSearch({ initialSearchQuery }: HeaderMobileSearchProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t("nav.searchAria")}
        className="flex shrink-0 items-center justify-center text-slate-500 transition-colors hover:text-[#2f67e8] lg:hidden dark:text-slate-400 dark:hover:text-blue-400"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" strokeLinecap="round" />
        </svg>
      </button>

      <div className={`fixed inset-0 z-40 lg:hidden ${isOpen ? "" : "pointer-events-none"}`} aria-hidden={!isOpen}>
        <button
          type="button"
          tabIndex={isOpen ? 0 : -1}
          aria-label={t("common.close")}
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-slate-950/40 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.searchAria")}
          className={`absolute inset-x-0 top-0 border-b border-slate-200 bg-white p-4 shadow-lg transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 ${
            isOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <form role="search" action="/search" method="GET" className="flex items-center gap-3">
            <div className="flex h-14 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 shadow-sm focus-within:border-[#2f67e8]/40 focus-within:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus-within:bg-slate-900">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
              <label htmlFor="site-search-mobile" className="sr-only">
                {t("nav.searchAria")}
              </label>
              <Suspense
                fallback={
                  <input
                    id="site-search-mobile"
                    name="q"
                    type="search"
                    defaultValue={initialSearchQuery}
                    placeholder={SEARCH_PLACEHOLDER}
                    className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                }
              >
                {isOpen && <HeaderSearchInput id="site-search-mobile" initialQuery={initialSearchQuery} autoFocus />}
              </Suspense>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={t("nav.closeSearch")}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
