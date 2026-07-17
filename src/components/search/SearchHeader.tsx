import Link from "next/link";

type SearchHeaderProps = {
  query: string;
  resultCount: number;
};

export function SearchHeader({ query, resultCount }: SearchHeaderProps) {
  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="transition-colors hover:text-[#2f67e8]">
          Home
        </Link>
        <span aria-hidden="true">›</span>
        <span className="font-medium text-slate-950">
          {query ? `Search Results for "${query}"` : "Search"}
        </span>
      </nav>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">Search Results</h1>
          {query ? (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-base text-slate-500">
              Showing results for &quot;{query}&quot;
              <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-[#2f67e8]">
                {resultCount} {resultCount === 1 ? "result" : "results"}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-base text-slate-500">Enter a keyword to get started</p>
          )}
        </div>

        {query && (
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm"
          >
            Sort by: <span className="font-semibold text-slate-950">Most Relevant</span>
          </button>
        )}
      </div>
    </div>
  );
}
