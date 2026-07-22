"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "stars", label: "Most Stars" },
  { value: "updated", label: "Recently Updated" },
  { value: "name", label: "Name (A-Z)" },
];

/** GitHub Explorer's own sort control (Stars / Recently Updated / Name) - distinct from `CatalogSortControl`'s Featured/Name-only options, since repo sorting is meaningfully different from the curated catalog's "featured" concept. Same instant-apply convention. */
export function GithubSortControl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "stars";

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
