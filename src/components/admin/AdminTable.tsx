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
};

/**
 * Generic, reusable table for tabular admin data (this phase: the
 * Runtime schedule; future phases: Articles/Sources/Users lists).
 * Deliberately column-configurable rather than hard-coded per use site,
 * so later phases don't need a new table component per page.
 */
export function AdminTable<T>({ columns, rows, getRowKey, emptyMessage = "No data yet." }: AdminTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="text-slate-700">
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
