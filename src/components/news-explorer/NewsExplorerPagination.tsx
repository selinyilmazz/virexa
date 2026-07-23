import Link from "next/link";

type NewsExplorerPaginationProps = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

/** Pages shown on each side of the current page before collapsing into "…" - see `buildPageWindow`'s doc comment. */
const DELTA = 2;

/**
 * Builds the dynamic page-number window: always page 1 and the last
 * page, plus up to `DELTA` pages on each side of `current`, collapsing
 * any gap into a single `"ellipsis"` entry rather than listing every
 * page. E.g. (delta=2, total=128): page 1 -> [1,2,3,…,128], page 10 ->
 * [1,…,8,9,10,11,12,…,128], page 128 -> [1,…,126,127,128]. Small
 * `totalPages` values render every page with no ellipsis at all, since
 * the window already covers the whole range.
 */
function buildPageWindow(current: number, total: number): (number | "ellipsis")[] {
  const middle: number[] = [];
  for (let page = Math.max(2, current - DELTA); page <= Math.min(total - 1, current + DELTA); page += 1) {
    middle.push(page);
  }

  const items: (number | "ellipsis")[] = [];
  if (current - DELTA > 2) {
    items.push(1, "ellipsis");
  } else {
    items.push(1);
  }

  items.push(...middle);

  if (current + DELTA < total - 1) {
    items.push("ellipsis", total);
  } else if (total > 1) {
    items.push(total);
  }

  return items.filter((item, index, array) => item !== array[index - 1] || item === "ellipsis");
}

/**
 * Real server-side pagination for `/news` - Previous/Next plus a
 * dynamic page-number window (see `buildPageWindow`), replacing the
 * earlier "Load More" pattern. Plain `<Link>`s (no client JS required
 * for the navigation itself) with `scroll={false}` - the page's own
 * `ScrollToResultsOnPageChange` handles a SMOOTH scroll back to the top
 * of the article list instead of Next's default instant jump to the
 * top of the whole page.
 */
export function NewsExplorerPagination({ page, totalPages, buildHref }: NewsExplorerPaginationProps) {
  if (totalPages <= 1) return null;

  const items = buildPageWindow(page, totalPages);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  const pageButtonBase = "flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors";
  const inactivePageClass = `${pageButtonBase} border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50`;
  const activePageClass = `${pageButtonBase} border-[#2f67e8] bg-[#2f67e8] text-white`;
  const navButtonClass =
    "flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50";
  const navButtonDisabledClass =
    "flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-300 opacity-50 cursor-not-allowed";

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {isFirst ? (
        <span aria-hidden="true" className={navButtonDisabledClass}>
          ← Previous
        </span>
      ) : (
        <Link href={buildHref(page - 1)} scroll={false} className={navButtonClass}>
          ← Previous
        </Link>
      )}

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} aria-hidden="true" className="flex h-11 min-w-11 items-center justify-center text-sm text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            scroll={false}
            aria-current={item === page ? "page" : undefined}
            className={item === page ? activePageClass : inactivePageClass}
          >
            {item}
          </Link>
        )
      )}

      {isLast ? (
        <span aria-hidden="true" className={navButtonDisabledClass}>
          Next →
        </span>
      ) : (
        <Link href={buildHref(page + 1)} scroll={false} className={navButtonClass}>
          Next →
        </Link>
      )}
    </nav>
  );
}
