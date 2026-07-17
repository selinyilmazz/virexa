"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type CategoryFilterOption = {
  slug: string;
  label: string;
  count: number;
};

type CategoryFilterCardProps = {
  options: CategoryFilterOption[];
};

export function CategoryFilterCard({ options }: CategoryFilterCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlugs = searchParams.get("categories")?.split(",").filter(Boolean) ?? [];

  function toggleCategory(slug: string) {
    const nextSlugs = selectedSlugs.includes(slug)
      ? selectedSlugs.filter((item) => item !== slug)
      : [...selectedSlugs, slug];

    const params = new URLSearchParams(searchParams.toString());
    if (nextSlugs.length > 0) {
      params.set("categories", nextSlugs.join(","));
    } else {
      params.delete("categories");
    }
    params.delete("page");
    router.push(`/search?${params.toString()}`, { scroll: false });
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("categories");
    params.delete("time");
    params.delete("page");
    router.push(`/search?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold tracking-tight text-slate-950">Categories</h2>

      <div className="mt-4 space-y-2">
        {options.map((option) => {
          const isSelected = selectedSlugs.includes(option.slug);
          return (
            <label
              key={option.slug}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategory(option.slug)}
                  className="size-4 rounded accent-[#2f67e8]"
                />
                <span className="text-base font-medium text-slate-700">{option.label}</span>
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {option.count}
              </span>
            </label>
          );
        })}
      </div>

      <button
        type="button"
        onClick={clearFilters}
        className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-[#2f67e8]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 12a9 9 0 1 1 3 6.7" />
          <path d="M3 16v-4h4" />
        </svg>
        Clear All Filters
      </button>
    </div>
  );
}
