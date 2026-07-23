"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type AdminPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  /** Plural noun for the "Showing X-Y of Z <itemLabel>" line, e.g. "articles". */
  itemLabel?: string;
  pageSizeOptions?: number[];
  /**
   * Extra query param keys to drop when building a page link, on top of
   * `page`/`pageSize` (always dropped). Defaults to the two drawer-opening
   * params every admin listing page uses (`edit`, `selected`) so paging
   * through a list always closes whatever drawer happens to be open,
   * instead of re-navigating to it on a different page of results.
   */
  excludeParams?: string[];
};

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_EXCLUDED_PARAMS = ["edit", "selected"];
const DOTS = "…";

/**
 * The one pagination component every admin listing page uses (requirement
 * 8/10: "Use exactly the same pagination component across the entire
 * admin panel"). Replaces the old `components/category/Pagination.tsx`
 * pattern of rendering every single page number (unusable once a list
 * has 70+ pages) with a windowed page list - first/last page always
 * shown, a few pages around the current one, "…" for the gaps - plus
 * First/Prev/Next/Last buttons, a page-size selector, and a real
 * "Showing X–Y of Z" range line.
 *
 * Regression fix: this used to take a `buildHref` *function* prop built
 * by the caller's Server Component page.tsx and handed down into this
 * Client Component - which Next.js rejects at runtime ("Functions cannot
 * be passed directly to Client Components"), because function props
 * aren't serializable across the Server/Client boundary. That's exactly
 * what broke `/admin/articles` (and, latently, every other page using
 * this component - Repositories/Releases/Sources/Users/Catalog Items all
 * had the same bug, just not yet hit). Fixed by having this component
 * build its own hrefs internally via `usePathname()`/`useSearchParams()`
 * (both client-side hooks, safe here since this is already `"use
 * client"`) instead of accepting a function prop at all - callers now
 * only ever pass plain serializable values (numbers, strings, string
 * arrays).
 *
 * Page number buttons are real `<Link>`s (not buttons with onClick) so
 * every page is a real URL - keyboard-navigable, middle-click-to-new-tab,
 * and crawlable, matching the server-driven filter/search convention
 * already used by `/admin/articles`. Only the page-size `<select>` needs
 * client-side navigation (a native select can't itself be a link), which
 * is the one reason this is a Client Component.
 */
export function AdminPagination({
  page,
  pageSize,
  totalItems,
  itemLabel = "results",
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  excludeParams = DEFAULT_EXCLUDED_PARAMS,
}: AdminPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  if (totalItems === 0) return null;

  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  const pageItems = buildPageList(currentPage, totalPages);

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  function buildHref(targetPage: number, targetPageSize: number): string {
    const query = new URLSearchParams(searchParams.toString());
    for (const key of ["page", "pageSize", ...excludeParams]) query.delete(key);
    query.set("page", String(targetPage));
    query.set("pageSize", String(targetPageSize));
    const queryString = query.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  const navBase =
    "flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f67e8]";
  const navDisabled = "flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 px-2 text-sm font-medium text-slate-300 cursor-not-allowed";

  function NavLink({ targetPage, disabled, label, children }: { targetPage: number; disabled: boolean; label: string; children: React.ReactNode }) {
    if (disabled) {
      return (
        <span aria-hidden="true" className={navDisabled}>
          {children}
        </span>
      );
    }
    return (
      <Link href={buildHref(targetPage, pageSize)} aria-label={label} className={navBase}>
        {children}
      </Link>
    );
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row"
    >
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>
          Showing <span className="font-medium text-slate-700">{rangeStart.toLocaleString()}</span>
          {"–"}
          <span className="font-medium text-slate-700">{rangeEnd.toLocaleString()}</span> of{" "}
          <span className="font-medium text-slate-700">{totalItems.toLocaleString()}</span> {itemLabel}
        </span>

        <label className="flex items-center gap-1.5">
          <span className="sr-only">Rows per page</span>
          <select
            value={pageSize}
            onChange={(event) => router.push(buildHref(1, Number(event.target.value)))}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f67e8]"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <NavLink targetPage={1} disabled={isFirst} label="First page">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m17 6-6 6 6 6M8 6v12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </NavLink>
        <NavLink targetPage={currentPage - 1} disabled={isFirst} label="Previous page">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </NavLink>

        {pageItems.map((item, index) =>
          item === DOTS ? (
            <span key={`dots-${index}`} aria-hidden="true" className="flex h-9 min-w-9 items-center justify-center text-sm text-slate-400">
              {DOTS}
            </span>
          ) : (
            <Link
              key={item}
              href={buildHref(item, pageSize)}
              aria-current={item === currentPage ? "page" : undefined}
              className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f67e8] ${
                item === currentPage
                  ? "bg-[#2f67e8] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item}
            </Link>
          )
        )}

        <NavLink targetPage={currentPage + 1} disabled={isLast} label="Next page">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </NavLink>
        <NavLink targetPage={totalPages} disabled={isLast} label="Last page">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m7 6 6 6-6 6M16 6v12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </NavLink>
      </div>
    </nav>
  );
}

/**
 * Windowed page list: always shows page 1 and the last page, plus one
 * sibling on each side of the current page, collapsing any gap into a
 * single "…" - e.g. `1 … 12 13 14 [15] 16 17 18 … 75` (the exact shape
 * requested). Falls back to a plain `1..totalPages` list when everything
 * fits without needing to collapse anything.
 */
function buildPageList(current: number, total: number, siblingCount = 1): (number | typeof DOTS)[] {
  const totalSlots = siblingCount * 2 + 5; // first + last + current + 2 siblings + 2 dots-worth of slack
  if (total <= totalSlots) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => i + 1);
    return [...leftRange, DOTS, total];
  }

  if (showLeftDots && !showRightDots) {
    const rightCount = 3 + siblingCount * 2;
    const rightRange = Array.from({ length: rightCount }, (_, i) => total - rightCount + 1 + i);
    return [1, DOTS, ...rightRange];
  }

  const middleRange = Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i);
  return [1, DOTS, ...middleRange, DOTS, total];
}
