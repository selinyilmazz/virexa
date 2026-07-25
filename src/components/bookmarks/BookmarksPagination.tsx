type BookmarksPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

/**
 * Client-side pagination for a single Bookmarks tab. Every bookmark for
 * the signed-in user is already loaded into memory by `lib/bookmarks.ts`'s
 * store (one `list()` call, no server pagination in the repository
 * layer - see `bookmark-repository.ts`), so this pages through the
 * already-fetched, per-tab array with `onClick`/state rather than
 * `NewsExplorerPagination`'s `<Link href>` (which needs a server-rendered
 * URL per page). Same button styling as that component, adapted to be a
 * plain controlled control instead of URL-driven.
 */
export function BookmarksPagination({ page, totalPages, onPageChange }: BookmarksPaginationProps) {
  if (totalPages <= 1) return null;

  const isFirst = page <= 1;
  const isLast = page >= totalPages;
  const pageButtonBase = "flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors";
  const inactivePageClass = `${pageButtonBase} border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800`;
  const activePageClass = `${pageButtonBase} border-[#2f67e8] bg-[#2f67e8] text-white`;
  const navButtonClass =
    "flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800";
  const navButtonDisabledClass =
    "flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-sm font-semibold text-slate-300 dark:text-slate-700 opacity-50 cursor-not-allowed";

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button type="button" disabled={isFirst} onClick={() => onPageChange(page - 1)} className={isFirst ? navButtonDisabledClass : navButtonClass}>
        ← Previous
      </button>

      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          aria-current={item === page ? "page" : undefined}
          className={item === page ? activePageClass : inactivePageClass}
        >
          {item}
        </button>
      ))}

      <button type="button" disabled={isLast} onClick={() => onPageChange(page + 1)} className={isLast ? navButtonDisabledClass : navButtonClass}>
        Next →
      </button>
    </nav>
  );
}
