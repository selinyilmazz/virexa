"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 400;

/**
 * Debounced search-as-you-type ("debounce desteklensin"). Lives inside
 * the existing `<form action="/search" method="GET">` in `Header.tsx`
 * unchanged, so pressing Enter or clicking the search button still
 * submits natively (works with JS disabled) - this component only adds
 * an additional, debounced `router.push` while typing. Same markup and
 * classes as the original plain `<input>`, so the header's visual
 * design is unchanged.
 *
 * Uncontrolled by design: the DOM input owns its own value while
 * typing (no per-keystroke re-render), and `key={currentQuery}` forces
 * a remount - resetting the field to the URL's current `q` - only when
 * that external value actually changes (e.g. clearing filters, browser
 * back/forward). This avoids syncing state via a `useEffect`.
 */
export function HeaderSearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSearchPage = pathname === "/search";
  const currentQuery = isSearchPage ? (searchParams.get("q") ?? "") : "";
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(nextValue: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const trimmed = nextValue.trim();
      // Off the search page, don't navigate away while the field is
      // still empty (e.g. on initial focus) - only once there's a
      // real query to search for.
      if (!isSearchPage && trimmed.length === 0) return;

      const params = new URLSearchParams(isSearchPage ? searchParams.toString() : "");
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.push(`/search?${params.toString()}`, { scroll: false });
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
      placeholder="Search news, topics or sources..."
      autoComplete="off"
      className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-500"
    />
  );
}
