"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/i18n/i18n-provider";

const DEBOUNCE_MS = 400;

/**
 * Every unified Explorer route - each owns its own `q` param and should
 * be searched IN PLACE rather than navigated away from. This is what
 * makes the header the ONE search box for the whole app: `/category/*`
 * only lists the three category slugs that render the shared
 * `ExplorerView` (`ai`/`programming`/`security` - see
 * `category/[slug]/page.tsx`); every other real category keeps its
 * original, non-Explorer layout and has no `q`-param-driven content, so
 * typing there still (correctly) navigates to `/search` like before.
 * Every other page not listed here falls back to navigating to
 * `/search` too.
 */
const IN_PLACE_SEARCH_PATHS = [
  "/search",
  "/news",
  "/category/ai",
  "/category/programming",
  "/category/security",
  "/cloud",
  "/open-source",
  "/resources",
  // Developer Hub's 8 dedicated catalog pages (see `CatalogExplorerView`/
  // `ExplorerView`'s `defaultResourceType`/`defaultContentType`) - each
  // owns a `q` param the same way every other Explorer route does. The
  // `/developer-hub` landing page itself is deliberately NOT listed here:
  // it's a static overview/dashboard with no filterable list of its own,
  // so typing there should navigate to `/search` like any other page.
  "/developer-hub/certifications",
  "/developer-hub/courses",
  "/developer-hub/learning-paths",
  "/developer-hub/github",
  "/developer-hub/tools",
  "/developer-hub/roadmaps",
  "/developer-hub/releases",
  "/developer-hub/cheat-sheets",
];

type HeaderSearchInputProps = {
  /** Effective query to show when the URL has no real `q` param yet - see `Header`'s `initialSearchQuery` doc comment. */
  initialQuery?: string;
};

/**
 * Debounced search-as-you-type ("debounce desteklensin"). Lives inside
 * the existing `<form action="/search" method="GET">` in `Header.tsx`
 * unchanged, so pressing Enter or clicking the search button still
 * submits natively (works with JS disabled, always landing on `/search`
 * as a graceful fallback) - this component only adds an additional,
 * debounced `router.push` while typing. Same markup and classes as the
 * original plain `<input>`, so the header's visual design is unchanged.
 *
 * Uncontrolled by design: the DOM input owns its own value while
 * typing (no per-keystroke re-render), and `key={currentQuery}` forces
 * a remount - resetting the field to the URL's current `q` - only when
 * that external value actually changes (e.g. clearing filters, browser
 * back/forward). This avoids syncing state via a `useEffect`.
 */
export function HeaderSearchInput({ initialQuery }: HeaderSearchInputProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInPlaceSearchPage = IN_PLACE_SEARCH_PATHS.includes(pathname);
  const currentQuery = isInPlaceSearchPage ? (searchParams.get("q") ?? initialQuery ?? "") : "";
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(nextValue: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const trimmed = nextValue.trim();
      // Off an in-place search page, don't navigate away while the
      // field is still empty (e.g. on initial focus) - only once
      // there's a real query to search for.
      if (!isInPlaceSearchPage && trimmed.length === 0) return;

      const params = new URLSearchParams(isInPlaceSearchPage ? searchParams.toString() : "");
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      params.delete("page");
      // Search in place on `/search`/`/news` (keeps every other filter
      // in the URL intact); everywhere else, navigate TO `/search`.
      const targetPath = isInPlaceSearchPage ? pathname : "/search";
      router.push(`${targetPath}?${params.toString()}`, { scroll: false });
    }, DEBOUNCE_MS);
  }

  return (
    <input
      key={currentQuery}
      id="site-search"
      name="q"
      type="search"
      defaultValue={currentQuery}
      onChange={(event) => handleChange(event.target.value)}
      placeholder={t("nav.searchPlaceholder")}
      autoComplete="off"
      className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-500"
    />
  );
}
