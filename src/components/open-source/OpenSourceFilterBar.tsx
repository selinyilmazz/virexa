import Link from "next/link";
import { OPEN_SOURCE_SORT_OPTIONS, type OpenSourceSort } from "@/services/open-source/open-source-service";

type OpenSourceFilterBarProps = {
  activeSort: OpenSourceSort;
  buildSortHref: (sort: OpenSourceSort) => string;
};

function GithubMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.5v-1.95c-2.93.64-3.55-1.25-3.55-1.25-.48-1.22-1.17-1.55-1.17-1.55-.96-.65.07-.64.07-.64 1.06.07 1.62 1.09 1.62 1.09.94 1.61 2.46 1.15 3.06.88.1-.68.37-1.15.67-1.42-2.34-.27-4.8-1.17-4.8-5.2 0-1.15.41-2.09 1.08-2.83-.11-.27-.47-1.34.1-2.79 0 0 .88-.28 2.89 1.08a9.9 9.9 0 0 1 5.26 0c2-1.36 2.89-1.08 2.89-1.08.57 1.45.21 2.52.1 2.79.68.74 1.08 1.68 1.08 2.83 0 4.04-2.47 4.93-4.82 5.19.38.33.72.97.72 1.96v2.9c0 .27.18.61.73.5A10.5 10.5 0 0 0 12 1.5Z" />
    </svg>
  );
}

function ExternalLinkIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

/**
 * Filter tabs (Trending/New/Most Starred/Most Forked/Recently Updated) +
 * a "View on GitHub" link, directly below the hero per spec. Plain
 * `Link`s driven by the `sort` URL param (not client-side state) - same
 * "URL is the source of truth for filters" convention every other
 * Explorer page in this app already follows, so the active tab survives
 * a refresh/share and Back button works correctly.
 */
export function OpenSourceFilterBar({ activeSort, buildSortHref }: OpenSourceFilterBarProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
      <nav aria-label="Sort repositories" className="flex flex-wrap items-center gap-1.5">
        {OPEN_SOURCE_SORT_OPTIONS.map((option) => {
          const isActive = option.value === activeSort;
          return (
            <Link
              key={option.value}
              href={buildSortHref(option.value)}
              aria-current={isActive ? "true" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? "bg-[#2f67e8] text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </nav>

      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:border-[#2f67e8] hover:text-[#2f67e8] dark:border-slate-800 dark:text-slate-300"
      >
        <GithubMark />
        View on GitHub
        <ExternalLinkIcon />
      </a>
    </div>
  );
}
