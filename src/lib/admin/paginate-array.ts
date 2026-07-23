export type PagedArrayResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * Slices an already-fetched array into one page (requirement 10: "Unify
 * all pagination" across every admin listing, including small, bounded
 * tables like Sources/Developer Releases/Catalog Items that don't
 * warrant a real DB `range()` query - see `source-repository.ts`'s doc
 * comment on why fetching the whole table at this scale is a deliberate,
 * cheap tradeoff). Keeps every listing page's pagination behavior
 * identical (via `AdminPagination`) regardless of whether the data
 * behind it comes from a DB range query or an in-memory slice.
 */
export function paginateArray<T>(all: T[], page: number, pageSize: number): PagedArrayResult<T> {
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * pageSize;
  return { items: all.slice(start, start + pageSize), total, page: clampedPage, pageSize, totalPages };
}
