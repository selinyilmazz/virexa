"use client";

import { useRouter, useSearchParams } from "next/navigation";

const ALL_SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
] as const;

/**
 * Real "Sort by" control (product polishing phase, area 1/6) - replaces
 * the previous static, non-interactive "Sort by: Most Relevant" button
 * that had no `onClick` at all. Writes the `sort` URL param immediately
 * (unlike Time/Category, which stage until "Apply" - sort is a display
 * preference, not a filter, so there's nothing to batch). "Most
 * Relevant" is only offered when a text query is present - relevance
 * ranking has no meaning for the filter-only browse path (see
 * `searchArticlesReal` in `article-read-service.ts`).
 */
export function SearchSortControl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasQuery = Boolean(searchParams.get("q")?.trim());
  const defaultSort = hasQuery ? "relevance" : "newest";
  const current = searchParams.get("sort") ?? defaultSort;
  const options = hasQuery ? ALL_SORT_OPTIONS : ALL_SORT_OPTIONS.filter((option) => option.value !== "relevance");

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultSort) {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    params.delete("page");
    router.push(`/search?${params.toString()}`, { scroll: false });
  }

  return (
    <label className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm">
      Sort by:
      <select
        value={current}
        onChange={(event) => handleChange(event.target.value)}
        className="cursor-pointer bg-transparent font-semibold text-slate-950 outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
