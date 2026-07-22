"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { GithubExplorerFacets, GithubUpdatedWindow } from "@/services/developer-hub/developer-hub-service";

const STAR_THRESHOLDS = [
  { value: "1000", label: "1,000+" },
  { value: "10000", label: "10,000+" },
  { value: "50000", label: "50,000+" },
  { value: "100000", label: "100,000+" },
];

const UPDATED_OPTIONS: { value: GithubUpdatedWindow; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
];

type GithubFiltersPanelProps = {
  facets: GithubExplorerFacets;
  languages: string[];
  licenses: string[];
  organizations: string[];
  topics: string[];
  minStars?: string;
  updatedWithin?: string;
};

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

/**
 * GitHub Explorer's own dedicated filter sidebar - Language / License /
 * Stars / Updated / Topics / Organization, distinct from the generic
 * `CatalogFiltersPanel` (Type/Difficulty/Price) every other Developer Hub
 * sub-page uses, since GitHub repos don't have a difficulty or price but
 * do have these live, repo-specific facets. Same instant-apply, no
 * "Apply" button, no-accordion convention as `CatalogFiltersPanel`/
 * `NewsExplorerFiltersPanel`. Facet option lists come from the server
 * (`getGithubExplorerItems`'s `facets`, computed off the full unfiltered
 * repo pool) so this component only ever renders real, currently-tracked
 * values - never a hardcoded guess at what languages/licenses exist.
 */
export function GithubFiltersPanel({ facets, languages, licenses, organizations, topics, minStars, updatedWithin }: GithubFiltersPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushParams(next: {
    languages?: string[];
    licenses?: string[];
    organizations?: string[];
    topics?: string[];
    minStars?: string;
    updatedWithin?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lang");
    params.delete("license");
    params.delete("org");
    params.delete("topic");
    params.delete("stars");
    params.delete("updated");
    params.delete("page");

    const nextLanguages = next.languages !== undefined ? next.languages : languages;
    const nextLicenses = next.licenses !== undefined ? next.licenses : licenses;
    const nextOrganizations = next.organizations !== undefined ? next.organizations : organizations;
    const nextTopics = next.topics !== undefined ? next.topics : topics;
    const nextMinStars = next.minStars !== undefined ? next.minStars : minStars;
    const nextUpdated = next.updatedWithin !== undefined ? next.updatedWithin : updatedWithin;

    if (nextLanguages.length > 0) params.set("lang", nextLanguages.join(","));
    if (nextLicenses.length > 0) params.set("license", nextLicenses.join(","));
    if (nextOrganizations.length > 0) params.set("org", nextOrganizations.join(","));
    if (nextTopics.length > 0) params.set("topic", nextTopics.join(","));
    if (nextMinStars) params.set("stars", nextMinStars);
    if (nextUpdated) params.set("updated", nextUpdated);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearAll() {
    pushParams({ languages: [], licenses: [], organizations: [], topics: [], minStars: "", updatedWithin: "" });
  }

  const checkboxClass = "size-4 rounded accent-[#2f67e8]";
  const labelClass =
    "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors duration-200 hover:bg-slate-50";
  const legendClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

  const hasActiveFilters =
    languages.length > 0 || licenses.length > 0 || organizations.length > 0 || topics.length > 0 || Boolean(minStars) || Boolean(updatedWithin);

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

      {facets.languages.length > 0 && (
        <fieldset>
          <legend className={legendClass}>Language</legend>
          <div className="mt-2 space-y-1">
            {facets.languages.map((language) => (
              <label key={language} className={labelClass}>
                <input
                  type="checkbox"
                  checked={languages.includes(language)}
                  onChange={() => pushParams({ languages: toggleValue(languages, language) })}
                  className={checkboxClass}
                />
                {language}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {facets.licenses.length > 0 && (
        <fieldset>
          <legend className={legendClass}>License</legend>
          <div className="mt-2 space-y-1">
            {facets.licenses.map((license) => (
              <label key={license} className={labelClass}>
                <input
                  type="checkbox"
                  checked={licenses.includes(license)}
                  onChange={() => pushParams({ licenses: toggleValue(licenses, license) })}
                  className={checkboxClass}
                />
                {license}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className={legendClass}>Stars</legend>
        <div className="mt-2 space-y-1">
          {STAR_THRESHOLDS.map((option) => (
            <label key={option.value} className={labelClass}>
              <input
                type="radio"
                name="stars"
                checked={minStars === option.value}
                onChange={() => pushParams({ minStars: minStars === option.value ? "" : option.value })}
                onClick={() => minStars === option.value && pushParams({ minStars: "" })}
                className="size-4 accent-[#2f67e8]"
              />
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
              <input
                type="radio"
                name="updated"
                checked={updatedWithin === option.value}
                onChange={() => pushParams({ updatedWithin: updatedWithin === option.value ? "" : option.value })}
                onClick={() => updatedWithin === option.value && pushParams({ updatedWithin: "" })}
                className="size-4 accent-[#2f67e8]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {facets.organizations.length > 0 && (
        <fieldset>
          <legend className={legendClass}>Organization</legend>
          <div className="mt-2 space-y-1">
            {facets.organizations.map((org) => (
              <label key={org} className={labelClass}>
                <input
                  type="checkbox"
                  checked={organizations.includes(org)}
                  onChange={() => pushParams({ organizations: toggleValue(organizations, org) })}
                  className={checkboxClass}
                />
                {org}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {facets.topics.length > 0 && (
        <fieldset>
          <legend className={legendClass}>Topics</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {facets.topics.map((topic) => {
              const active = topics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => pushParams({ topics: toggleValue(topics, topic) })}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${
                    active ? "border-[#2f67e8] bg-[#2f67e8]/10 text-[#2f67e8]" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
