"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  REPOSITORY_CATEGORY_LABELS,
  REPOSITORY_DIFFICULTY_LABELS,
  type RepositoryCategorySlug,
  type RepositoryDifficultySlug,
} from "@/lib/developer-hub/shared";
import type { GithubLibraryFacets } from "@/services/developer-hub/github-explorer-service";
import type { CollectionRow } from "@/types/database";

const SEARCH_DEBOUNCE_MS = 350;

const STAR_THRESHOLDS = [
  { value: "100", label: "100+" },
  { value: "1000", label: "1,000+" },
  { value: "10000", label: "10,000+" },
  { value: "50000", label: "50,000+" },
];

const UPDATED_OPTIONS = [
  { value: "day", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
];

const HEALTH_THRESHOLDS = [
  { value: "80", label: "80+ (Excellent)" },
  { value: "60", label: "60+ (Good)" },
  { value: "40", label: "40+ (Fair)" },
];

const TAG_TOGGLES: { param: string; label: string }[] = [
  { param: "aiRelated", label: "AI Related" },
  { param: "devTool", label: "Dev Tool" },
  { param: "cli", label: "CLI" },
  { param: "library", label: "Library" },
  { param: "framework", label: "Framework" },
  { param: "template", label: "Template" },
  { param: "tutorial", label: "Tutorial" },
];

const BOOLEAN_TOGGLES: { param: string; label: string }[] = [
  { param: "maintained", label: "Actively Maintained" },
  { param: "verified", label: "Verified" },
  { param: "editorPick", label: "Editor's Pick" },
  { param: "hiddenGem", label: "Hidden Gems" },
  { param: "beginnerFriendly", label: "Beginner Friendly" },
  { param: "onlyTrending", label: "Only Trending" },
];

type GithubLibraryFiltersPanelProps = {
  facets: GithubLibraryFacets;
  collections: (CollectionRow & { repoCount: number })[];
};

/**
 * The full GitHub Library filter sidebar - every filter the redesign
 * spec calls for (Search, Category, Language, License, Stars, Updated,
 * Health, Difficulty, Maintained, Verified, Editor's Pick, Hidden Gems,
 * Beginner Friendly, AI Related/Dev Tool/CLI/Library/Framework/Template/
 * Tutorial tags, Collection). Every control reads/writes the URL
 * directly (no local "Apply" step, no staged state) so the whole filter
 * state - and therefore the whole result set - round-trips through
 * `?query params` and survives a reload or share, per the spec's
 * explicit persistence requirement. Facet option lists (languages/
 * licenses/categories present) come from the server
 * (`getGithubLibraryRepos`'s `facets`, computed off the full unfiltered
 * pool) so a filter never offers an option with zero possible matches.
 */
export function GithubLibraryFiltersPanel({ facets, collections }: GithubLibraryFiltersPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
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
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
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

  function setParam(key: string, value: string | undefined) {
    pushParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  }

  function toggleRadio(key: string, value: string) {
    setParam(key, searchParams.get(key) === value ? undefined : value);
  }

  function toggleFlag(key: string) {
    setParam(key, searchParams.get(key) === "1" ? undefined : "1");
  }

  const category = searchParams.get("category") ?? "";
  const language = searchParams.get("lang") ?? "";
  const license = searchParams.get("license") ?? "";
  const minStars = searchParams.get("minStars") ?? "";
  const updated = searchParams.get("updated") ?? "";
  const minHealth = searchParams.get("minHealth") ?? "";
  const difficulty = searchParams.get("difficulty") ?? "";
  const collection = searchParams.get("collection") ?? "";

  const hasActiveFilters = Array.from(searchParams.keys()).some((key) => key !== "page" && key !== "sort");

  function clearAll() {
    router.push(pathname, { scroll: false });
    setSearch("");
  }

  const checkboxClass = "size-4 rounded accent-[#2f67e8]";
  const radioClass = "size-4 accent-[#2f67e8]";
  const labelClass = "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors duration-200 hover:bg-slate-50";
  const legendClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-slate-950">Filters</h2>
        {hasActiveFilters && (
          <button type="button" onClick={clearAll} className="text-xs font-medium text-slate-500 transition-colors duration-200 hover:text-slate-700">
            Clear all
          </button>
        )}
      </div>

      <div className="relative">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search repositories..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#2f67e8] focus:outline-none focus:ring-2 focus:ring-[#2f67e8]/20"
        />
      </div>

      <fieldset>
        <legend className={legendClass}>Category</legend>
        <div className="mt-2 space-y-1">
          {facets.categories.map((slug) => (
            <label key={slug} className={labelClass}>
              <input type="radio" name="category" checked={category === slug} onChange={() => toggleRadio("category", slug)} className={radioClass} />
              {REPOSITORY_CATEGORY_LABELS[slug as RepositoryCategorySlug].emoji} {REPOSITORY_CATEGORY_LABELS[slug as RepositoryCategorySlug].label}
            </label>
          ))}
        </div>
      </fieldset>

      {collections.length > 0 && (
        <fieldset>
          <legend className={legendClass}>Collection</legend>
          <div className="mt-2 space-y-1">
            {collections.map((c) => (
              <label key={c.id} className={labelClass}>
                <input type="radio" name="collection" checked={collection === c.slug} onChange={() => toggleRadio("collection", c.slug)} className={radioClass} />
                {c.icon || "📁"} {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {facets.languages.length > 0 && (
        <fieldset>
          <legend className={legendClass}>Language</legend>
          <select
            value={language}
            onChange={(event) => setParam("lang", event.target.value || undefined)}
            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
          >
            <option value="">All Languages</option>
            {facets.languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </fieldset>
      )}

      {facets.licenses.length > 0 && (
        <fieldset>
          <legend className={legendClass}>License</legend>
          <select
            value={license}
            onChange={(event) => setParam("license", event.target.value || undefined)}
            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
          >
            <option value="">Any License</option>
            {facets.licenses.map((lic) => (
              <option key={lic} value={lic}>
                {lic}
              </option>
            ))}
          </select>
        </fieldset>
      )}

      <fieldset>
        <legend className={legendClass}>Stars</legend>
        <div className="mt-2 space-y-1">
          {STAR_THRESHOLDS.map((option) => (
            <label key={option.value} className={labelClass}>
              <input type="radio" name="minStars" checked={minStars === option.value} onChange={() => toggleRadio("minStars", option.value)} className={radioClass} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Updated</legend>
        <div className="mt-2 space-y-1">
          {UPDATED_OPTIONS.map((option) => (
            <label key={option.value} className={labelClass}>
              <input type="radio" name="updated" checked={updated === option.value} onChange={() => toggleRadio("updated", option.value)} className={radioClass} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Health Score</legend>
        <div className="mt-2 space-y-1">
          {HEALTH_THRESHOLDS.map((option) => (
            <label key={option.value} className={labelClass}>
              <input type="radio" name="minHealth" checked={minHealth === option.value} onChange={() => toggleRadio("minHealth", option.value)} className={radioClass} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Difficulty</legend>
        <div className="mt-2 space-y-1">
          {(Object.keys(REPOSITORY_DIFFICULTY_LABELS) as RepositoryDifficultySlug[]).map((slug) => (
            <label key={slug} className={labelClass}>
              <input type="radio" name="difficulty" checked={difficulty === slug} onChange={() => toggleRadio("difficulty", slug)} className={radioClass} />
              {REPOSITORY_DIFFICULTY_LABELS[slug]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Curation</legend>
        <div className="mt-2 space-y-1">
          {BOOLEAN_TOGGLES.map((toggle) => (
            <label key={toggle.param} className={labelClass}>
              <input type="checkbox" checked={searchParams.get(toggle.param) === "1"} onChange={() => toggleFlag(toggle.param)} className={checkboxClass} />
              {toggle.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Tags</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TAG_TOGGLES.map((tag) => {
            const active = searchParams.get(tag.param) === "1";
            return (
              <button
                key={tag.param}
                type="button"
                onClick={() => toggleFlag(tag.param)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${
                  active ? "border-[#2f67e8] bg-[#2f67e8]/10 text-[#2f67e8]" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
