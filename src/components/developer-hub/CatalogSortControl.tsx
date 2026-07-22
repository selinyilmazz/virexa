"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Adapted from the mockup's "Most Popular / Newest / Highest Rated" -
 * Virexa has no real popularity or rating data for external
 * certifications/courses/tools (see `src/data/developer-hub.ts`'s doc
 * comment), so those two options were replaced with the honest
 * equivalents: "Featured" (the curated highlight order) and "Name (A-Z)".
 * Same instant-apply convention as `NewsExplorerSortControl`.
 */
const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "az", label: "Name (A-Z)" },
];

export function CatalogSortControl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "featured";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      Sort by
      <select
        value={currentSort}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 outline-none transition-colors duration-200 focus:border-[#2f67e8]"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
