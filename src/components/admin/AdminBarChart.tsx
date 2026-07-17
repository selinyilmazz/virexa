type AdminBarChartItem = {
  label: string;
  value: number;
  href?: string;
};

type AdminBarChartProps = {
  items: AdminBarChartItem[];
  color?: string;
  formatValue?: (value: number) => string;
  emptyMessage?: string;
};

/**
 * Ranked horizontal bar list - Admin Analytics' Top Lists and AI
 * distribution charts (requirements 3/4/6). Pure CSS (a percentage-width
 * `div`, no SVG/canvas needed for a single-series bar), so it's
 * naturally responsive with no `viewBox`/resize logic at all - the
 * lightest possible option for this shape of data. Reused for every top
 * list (most-viewed, most-bookmarked, highest trust/trending, most
 * active sources, most-used categories) and every AI distribution
 * (provider/model/sentiment/bias), same component throughout.
 */
export function AdminBarChart({ items, color = "#2f67e8", formatValue, emptyMessage = "No data yet." }: AdminBarChartProps) {
  const format = formatValue ?? ((value: number) => value.toLocaleString());

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const widthPercent = Math.max(2, Math.round((item.value / max) * 100));
        const row = (
          <div className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm text-slate-700" title={item.label}>
              {item.label}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <span className="block h-full rounded-full" style={{ width: `${widthPercent}%`, backgroundColor: color }} />
            </span>
            <span className="w-14 shrink-0 text-right text-sm font-semibold text-slate-950">{format(item.value)}</span>
          </div>
        );

        return (
          <li key={`${item.label}-${index}`}>
            {item.href ? (
              <a href={item.href} className="block rounded-lg transition-colors hover:bg-slate-50">
                {row}
              </a>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}
