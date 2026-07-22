"use client";

import { useState } from "react";
import type { TechnologyRelease } from "@/data/releases";

type TabId = "overview" | "changelog" | "migration" | "api" | "resources";

const externalIcon = (
  <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

/**
 * Tab Navigation (requirement 7): Overview / Changelog / Migration Guide /
 * API Changes / Resources, each rendering in-place (no navigation away
 * from the page). Overview is always available; every other tab is only
 * included when its backing data actually exists on the technology
 * (`changelog`, `breakingChanges`+`migrationGuideUrl`, `apiChanges`,
 * `resources`) - a technology with none of the optional fields still
 * renders a perfectly valid single-tab page instead of four empty tabs.
 */
export function ReleaseTabs({ release }: { release: TechnologyRelease }) {
  const tabs: { id: TabId; label: string }[] = [{ id: "overview", label: "Overview" }];
  if (release.changelog && release.changelog.length > 0) tabs.push({ id: "changelog", label: "Changelog" });
  if (release.breakingChanges && release.breakingChanges.length > 0) tabs.push({ id: "migration", label: "Migration Guide" });
  if (release.apiChanges && release.apiChanges.length > 0) tabs.push({ id: "api", label: "API Changes" });
  if (release.resources && release.resources.length > 0) tabs.push({ id: "resources", label: "Resources" });

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const active = tabs.some((tab) => tab.id === activeTab) ? activeTab : "overview";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-3.5 py-2.5 text-sm font-semibold transition-colors ${
              active === tab.id ? "text-slate-950" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
            {active === tab.id && <span className="absolute inset-x-3.5 -bottom-px h-0.5 rounded-full bg-[#2f67e8]" />}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {active === "overview" && <p className="max-w-3xl text-[15px] leading-relaxed text-slate-700">{release.overview}</p>}

        {active === "changelog" && release.changelog && (
          <ol className="space-y-5 border-l border-slate-200 pl-5">
            {release.changelog.map((entry) => (
              <li key={entry.version} className="relative">
                <span className="absolute -left-[26px] top-1 size-2.5 rounded-full bg-[#2f67e8]" aria-hidden="true" />
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-950">v{entry.version.replace(/^v/i, "")}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(`${entry.date}T00:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{entry.summary}</p>
              </li>
            ))}
          </ol>
        )}

        {active === "migration" && release.breakingChanges && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-600">
              These are the changes most likely to require action when upgrading to {release.name} {release.version}.
            </p>
            <ul className="space-y-4">
              {release.breakingChanges.map((change) => (
                <li key={change.title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-sm font-bold text-slate-950">{change.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{change.description}</p>
                </li>
              ))}
            </ul>
            {release.migrationGuideUrl && (
              <a
                href={release.migrationGuideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2f67e8] hover:underline"
              >
                Read the full migration guide {externalIcon}
              </a>
            )}
          </div>
        )}

        {active === "api" && release.apiChanges && (
          <ul className="space-y-3">
            {release.apiChanges.map((change) => (
              <li key={change} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm leading-relaxed text-slate-700">
                {change}
              </li>
            ))}
          </ul>
        )}

        {active === "resources" && release.resources && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {release.resources.map((resource) => (
              <li key={resource.url}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-300 hover:bg-white hover:shadow-sm"
                >
                  {resource.label}
                  <span className="text-slate-400">{externalIcon}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
