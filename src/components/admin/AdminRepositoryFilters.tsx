"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type AdminRepositoryFiltersProps = {
  languages: string[];
};

const SEARCH_DEBOUNCE_MS = 400;

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "stars-desc", label: "Stars (high to low)" },
  { value: "stars-asc", label: "Stars (low to high)" },
  { value: "forks-desc", label: "Forks (high to low)" },
  { value: "watchers-desc", label: "Watchers (high to low)" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "last_synced_at-desc", label: "Recently synced" },
];

/**
 * Search/filter/sort bar for `/admin/repositories` - same URL-param-
 * driven convention as `AdminArticleFilters` (search debounces and
 * auto-applies, everything else navigates immediately on change since
 * there are only three simple controls here, not a ten-field form).
 */
export function AdminRepositoryFilters({ languages }: AdminRepositoryFiltersProps) {
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
    router.push(`/admin/repositories?${params.toString()}`, { scroll: false });
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

  const currentSort = `${searchParams.get("sort") ?? "stars"}-${searchParams.get("dir") ?? "desc"}`;
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
          placeholder="Search owner, repo, or description..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#2f67e8] focus:outline-none focus:ring-2 focus:ring-[#2f67e8]/20"
        />
      </div>

      <select
        value={searchParams.get("language") ?? ""}
        onChange={(event) => pushParams((params) => (event.target.value ? params.set("language", event.target.value) : params.delete("language")))}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
      >
        <option value="">All Languages</option>
        {languages.map((language) => (
          <option key={language} value={language}>
            {language}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("status") ?? ""}
        onChange={(event) => pushParams((params) => (event.target.value ? params.set("status", event.target.value) : params.delete("status")))}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="hidden">Hidden</option>
        <option value="archived">Archived</option>
      </select>

      <select
        value={currentSort}
        onChange={(event) =>
          pushParams((params) => {
            const [sort, dir] = event.target.value.split("-");
            params.set("sort", sort);
            params.set("dir", dir);
          })
        }
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            router.push("/admin/repositories", { scroll: false });
          }}
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Clear All
        </button>
      )}
    </div>
  );
}
