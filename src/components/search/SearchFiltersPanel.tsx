"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TimeFilterCard, type TimeFilterOption } from "@/components/search/TimeFilterCard";
import { CategoryFilterCard, type CategoryFilterOption } from "@/components/search/CategoryFilterCard";

type SearchFiltersPanelProps = {
  timeOptions: TimeFilterOption[];
  categoryOptions: CategoryFilterOption[];
  initialTime: string | null;
  initialCategories: string[];
};

/**
 * Owns the sidebar's staged filter state - Time and Category selections
 * no longer navigate on every click; they're only committed to the URL
 * when "Apply" is pressed ("Apply button must always update the
 * results", product polishing phase area 1).
 *
 * `initialTime`/`initialCategories` come from the server (parsed straight
 * off the URL by `app/search/page.tsx` -> `SearchFilters`), and
 * `SearchFilters` gives this component a `key` derived from those same
 * values - so any navigation that changes the URL's own `time`/
 * `categories` params from OUTSIDE this component (Back/Forward, a
 * filter link elsewhere, a fresh page load) remounts it with fresh
 * initial state instead of leaving stale local state behind. This is
 * the same "remount on external change" pattern `HeaderSearchInput`
 * already uses for the query box.
 */
export function SearchFiltersPanel({ timeOptions, categoryOptions, initialTime, initialCategories }: SearchFiltersPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [time, setTime] = useState<string | null>(initialTime);
  const [categories, setCategories] = useState<string[]>(initialCategories);

  const isDirty =
    time !== initialTime ||
    categories.length !== initialCategories.length ||
    categories.some((slug) => !initialCategories.includes(slug));

  function toggleCategory(slug: string) {
    setCategories((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));
  }

  function clearAll() {
    setTime(null);
    setCategories([]);
  }

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    if (time) {
      params.set("time", time);
    } else {
      params.delete("time");
    }
    if (categories.length > 0) {
      params.set("categories", categories.join(","));
    } else {
      params.delete("categories");
    }
    params.delete("page");
    router.push(`/search?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <TimeFilterCard options={timeOptions} selected={time} onChange={setTime} />
      <CategoryFilterCard options={categoryOptions} selected={categories} onToggle={toggleCategory} onClear={clearAll} />
      <button
        type="button"
        onClick={apply}
        disabled={!isDirty}
        className="w-full rounded-xl bg-[#2f67e8] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2555c7] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      >
        Apply Filters
      </button>
    </div>
  );
}
