export type BookmarksSort = "newest" | "oldest";
export type BookmarksFilter = "all" | "article" | "release" | "tutorial" | "repository" | "resource";

const FILTER_OPTIONS: { value: BookmarksFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "article", label: "Articles" },
  { value: "release", label: "Developer Releases" },
  { value: "tutorial", label: "Tutorials" },
  { value: "repository", label: "Open Source" },
  { value: "resource", label: "Resources" },
];

type BookmarksToolbarProps = {
  sort: BookmarksSort;
  onSortChange: (sort: BookmarksSort) => void;
  filter: BookmarksFilter;
  onFilterChange: (filter: BookmarksFilter) => void;
};

/**
 * Bookmarks page "RIGHT HEADER ACTIONS": Sort ("Newest ▼") + Filter
 * ("All ▼", with All/Articles/Developer Releases/Tutorials/Open
 * Source/Resources). Native `<select>` elements styled to match the
 * Linear/GitHub-flavored input language used elsewhere in this redesign,
 * kept fully controlled so `BookmarksContent` owns the actual sorting/
 * filtering logic.
 */
export function BookmarksToolbar({ sort, onSortChange, filter, onFilterChange }: BookmarksToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative">
        <span className="sr-only">Sort</span>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as BookmarksSort)}
          className="appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-4 pr-9 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition-colors hover:border-slate-300 focus:border-slate-300 focus:outline-none"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </label>

      <label className="relative">
        <span className="sr-only">Filter</span>
        <select
          value={filter}
          onChange={(event) => onFilterChange(event.target.value as BookmarksFilter)}
          className="appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-4 pr-9 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition-colors hover:border-slate-300 focus:border-slate-300 focus:outline-none"
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </label>
    </div>
  );
}
