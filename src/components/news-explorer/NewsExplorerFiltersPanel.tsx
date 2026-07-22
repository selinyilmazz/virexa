"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TIME_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "3m", label: "Last 3 Months" },
  { id: "1y", label: "Last Year" },
];

const CONTENT_TYPE_OPTIONS = [
  { id: "news", label: "News" },
  { id: "release", label: "Release" },
  { id: "tutorial", label: "Tutorial" },
  { id: "research", label: "Research" },
  { id: "security-advisory", label: "Security Advisory" },
  { id: "certification", label: "Certification" },
  { id: "open-source", label: "Open Source" },
];

type CategoryOption = { slug: string; name: string };
type SourceOption = { id: string; name: string; count: number };

type NewsExplorerFiltersPanelProps = {
  time?: string;
  categories: string[];
  sources: string[];
  type?: string;
  categoryOptions: CategoryOption[];
  sourceOptions: SourceOption[];
};

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

/**
 * News Explorer's sticky filter sidebar - Time / Categories / Sources /
 * Content Type, every section always expanded (no accordions, per the
 * UX pass request). Every change writes straight to the URL immediately
 * - no staged state, no "Apply" button - `q` and `sort` (owned by other
 * controls) are read straight off the current URL and carried through
 * untouched on every push, exactly the same way the search input
 * already preserves every other param.
 */
export function NewsExplorerFiltersPanel({
  time,
  categories,
  sources,
  type,
  categoryOptions,
  sourceOptions,
}: NewsExplorerFiltersPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushParams(next: { time?: string; categories?: string[]; sources?: string[]; type?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("time");
    params.delete("categories");
    params.delete("sources");
    params.delete("type");
    params.delete("page");

    const nextTime = next.time !== undefined ? next.time : time;
    const nextCategories = next.categories !== undefined ? next.categories : categories;
    const nextSources = next.sources !== undefined ? next.sources : sources;
    const nextType = next.type !== undefined ? next.type : type;

    if (nextTime) params.set("time", nextTime);
    if (nextCategories.length > 0) params.set("categories", nextCategories.join(","));
    if (nextSources.length > 0) params.set("sources", nextSources.join(","));
    if (nextType) params.set("type", nextType);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setTime(value: string | undefined) {
    pushParams({ time: value === time ? undefined : value });
  }

  function toggleCategory(slug: string) {
    pushParams({ categories: toggleValue(categories, slug) });
  }

  function toggleSource(id: string) {
    pushParams({ sources: toggleValue(sources, id) });
  }

  function setType(value: string | undefined) {
    pushParams({ type: value === type ? undefined : value });
  }

  function clearAll() {
    pushParams({ time: undefined, categories: [], sources: [], type: undefined });
  }

  const radioClass = "size-4 accent-[#2f67e8]";
  const checkboxClass = "size-4 rounded accent-[#2f67e8]";
  const labelClass = "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50";
  const legendClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-slate-950">Filters</h2>
        <button type="button" onClick={clearAll} className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700">
          Clear all
        </button>
      </div>

      <fieldset>
        <legend className={legendClass}>Time</legend>
        <div className="mt-2 space-y-1">
          {TIME_OPTIONS.map((option) => (
            <label key={option.id} className={labelClass}>
              <input type="radio" name="time" checked={time === option.id} onChange={() => setTime(option.id)} className={radioClass} />
              {option.label}
            </label>
          ))}
          {time && (
            <button type="button" onClick={() => setTime(undefined)} className="px-2 text-xs font-medium text-[#2f67e8] hover:underline">
              Clear
            </button>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Categories</legend>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
          {categoryOptions.map((option) => (
            <label key={option.slug} className={labelClass}>
              <input
                type="checkbox"
                checked={categories.includes(option.slug)}
                onChange={() => toggleCategory(option.slug)}
                className={checkboxClass}
              />
              {option.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Sources</legend>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
          {sourceOptions.map((option) => (
            <label key={option.id} className={`${labelClass} justify-between`}>
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sources.includes(option.id)}
                  onChange={() => toggleSource(option.id)}
                  className={checkboxClass}
                />
                {option.name}
              </span>
              <span className="text-xs text-slate-400">{option.count}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Content Type</legend>
        <div className="mt-2 space-y-1">
          {CONTENT_TYPE_OPTIONS.map((option) => (
            <label key={option.id} className={labelClass}>
              <input type="radio" name="type" checked={type === option.id} onChange={() => setType(option.id)} className={radioClass} />
              {option.label}
            </label>
          ))}
          {type && (
            <button type="button" onClick={() => setType(undefined)} className="px-2 text-xs font-medium text-[#2f67e8] hover:underline">
              Clear
            </button>
          )}
        </div>
      </fieldset>
    </div>
  );
}
