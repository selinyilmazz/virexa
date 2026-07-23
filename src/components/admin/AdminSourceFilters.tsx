"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Search bar for `/admin/sources` - same URL-param-driven, debounced
 * convention as `AdminReleaseFilters`/`AdminRepositoryFilters` (requirement
 * 10: unified pagination/filtering feel across every listing page).
 */
export function AdminSourceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    const queryString = params.toString();
    router.push(queryString ? `/admin/sources?${queryString}` : "/admin/sources", { scroll: false });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams((params) => {
        const trimmed = value.trim();
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");
      });
    }, SEARCH_DEBOUNCE_MS);
  }

  const hasActiveFilters = Array.from(searchParams.keys()).some((key) => key !== "page" && key !== "pageSize");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-64">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search name, domain, or country..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#2f67e8] focus:outline-none focus:ring-2 focus:ring-[#2f67e8]/20"
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            router.push("/admin/sources", { scroll: false });
          }}
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Clear All
        </button>
      )}
    </div>
  );
}
