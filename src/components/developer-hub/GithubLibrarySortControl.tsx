"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GITHUB_LIBRARY_SORT_OPTIONS } from "@/lib/developer-hub/shared";

/** GitHub Library's 8-option sort control (Editor's Pick default, Most Stars/Forks/Watchers, Newest, Recently Updated, Best Health Score, Most Bookmarked) - same instant-apply, URL-driven convention as every other sort control in the app. */
export function GithubLibrarySortControl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "editor-pick";

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
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 outline-none transition-colors duration-200 focus:border-slate-300"
      >
        {GITHUB_LIBRARY_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
