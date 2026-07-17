"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type AdvancedFilterOption = {
  value: string;
  label: string;
};

type AdvancedFilterCardProps = {
  sourceOptions: AdvancedFilterOption[];
  languageOptions: AdvancedFilterOption[];
  countryOptions: AdvancedFilterOption[];
};

const SELECT_CLASS =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white";

/**
 * Source / Language / Country search filters (Search Filters
 * requirement 5) - kept as their own card, separate from
 * `TimeFilterCard`/`CategoryFilterCard`, since those two are the
 * pre-existing filters and this is new, additive filtering. Same
 * visual language as the rest of the filter column (rounded-3xl white
 * card, `[#2f67e8]` accent) rather than a new design.
 *
 * Each select writes straight to the URL (`source`/`language`/
 * `country`) exactly like `TimeFilterCard`/`CategoryFilterCard` do, so
 * `search/page.tsx` picks the values up automatically through its
 * existing `searchParams` handling - no new plumbing needed there.
 */
export function AdvancedFilterCard({ sourceOptions, languageOptions, countryOptions }: AdvancedFilterCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedSource = searchParams.get("source") ?? "";
  const selectedLanguage = searchParams.get("language") ?? "";
  const selectedCountry = searchParams.get("country") ?? "";

  function updateParam(key: "source" | "language" | "country", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/search?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold tracking-tight text-slate-950">More Filters</h2>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="filter-source" className="text-xs font-medium text-slate-500">
            Source
          </label>
          <select
            id="filter-source"
            value={selectedSource}
            onChange={(event) => updateParam("source", event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Sources</option>
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-language" className="text-xs font-medium text-slate-500">
            Language
          </label>
          <select
            id="filter-language"
            value={selectedLanguage}
            onChange={(event) => updateParam("language", event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Languages</option>
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-country" className="text-xs font-medium text-slate-500">
            Country
          </label>
          <select
            id="filter-country"
            value={selectedCountry}
            onChange={(event) => updateParam("country", event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Countries</option>
            {countryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
