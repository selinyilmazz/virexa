import type { ReactNode } from "react";

export type AdminTableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

type AdminTableProps<T> = {
  columns: AdminTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  /** Renders skeleton rows instead of `rows` - for the rare client-fetched table; Server-Component-first tables (the vast majority) never need this since the data is already there on first paint. */
  loading?: boolean;
  /** Real error message from a failed fetch - shown instead of the table body. Distinct from `emptyMessage` (no error, genuinely zero rows). */
  error?: string | null;
  /** Optional per-row click handler (requirement 11: "Row click") - the row gets a pointer cursor and hover affordance when set. Cells that need their own click target (buttons/links in an Actions column) should call `event.stopPropagation()`. */
  onRowClick?: (row: T) => void;
};

/**
 * Generic, reusable table for tabular admin data - every admin listing
 * page (Articles/Sources/Repositories/Releases/Users/Catalog Items/
 * Analytics) renders through this one component so table UX never
 * diverges between pages (requirement 11: "No page should feel different
 * from another"). Sticky header, loading skeleton, and error state are
 * opt-in via props; empty/hover/responsive-scroll behavior is always on.
 */
export function AdminTable<T>({ columns, rows, getRowKey, emptyMessage = "No data yet.", loading = false, error = null, onRowClick }: AdminTableProps<T>) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-red-200 bg-red-50/60 px-4 py-8 text-center">
        <p className="text-sm font-medium text-red-700">Couldn&apos;t load this data.</p>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading
            ? Array.from({ length: 8 }, (_, index) => (
                <tr key={`skeleton-${index}`}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      <div className="h-4 w-full max-w-32 animate-pulse rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`text-slate-700 transition-colors hover:bg-slate-50/80 ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`whitespace-nowrap px-4 py-3 ${column.className ?? ""}`}>
                      {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
