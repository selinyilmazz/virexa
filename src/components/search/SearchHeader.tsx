import Link from "next/link";
import { SearchSortControl } from "@/components/search/SearchSortControl";

type SearchHeaderProps = {
  query: string;
  resultCount: number;
  hasFilters: boolean;
};

export function SearchHeader({ query, resultCount, hasFilters }: SearchHeaderProps) {
  const hasQuery = Boolean(query);
  const showResults = hasQuery || hasFilters;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="transition-colors hover:text-[#2f67e8]">
          Home
        </Link>
        <span aria-hidden="true">›</span>
        <span className="font-medium text-slate-950">
          {hasQuery ? `Search Results for "${query}"` : showResults ? "Filtered Results" : "Search"}
        </span>
      </nav>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">Search Results</h1>
          {showResults ? (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-base text-slate-500">
              {hasQuery ? (
                <>Showing results for &quot;{query}&quot;</>
              ) : (
                "Showing filtered results"
              )}
              <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-[#2f67e8]">
                {resultCount} {resultCount === 1 ? "result" : "results"}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-base text-slate-500">Enter a keyword or choose a filter to get started</p>
          )}
        </div>

        {showResults && <SearchSortControl />}
      </div>
    </div>
  );
}
