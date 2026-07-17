type AdminSparklineCardProps = {
  label: string;
  points: number[];
  /** Bucket labels (same length/order as `points`) - only the first, middle, and last are rendered beneath the chart to keep it uncluttered at 24-30 points. */
  bucketLabels?: string[];
  total: number;
  color?: string;
  formatValue?: (value: number) => string;
};

const VIEWBOX_WIDTH = 280;
const VIEWBOX_HEIGHT = 64;
const PADDING = 4;

/**
 * One Time Series metric card (requirement 2/6): a label, the window
 * total, and a lightweight SVG sparkline. Deliberately a hand-rolled,
 * dependency-free SVG line rather than a chart library - the project
 * has no chart dependency today (`package.json` only has
 * `@supabase/*`/`next`/`react`/`zod`), and a plain `<polyline>` in a
 * Server Component is the lightest, most SSR-native option available:
 * zero client JS, zero bundle cost, renders identically on the server.
 * Responsive via `viewBox` + `width="100%"` (requirement 6) - the SVG
 * scales to its container without any JS resize logic.
 *
 * Deliberately one series per card instead of one crowded multi-series
 * chart: `articleCount`/`viewCount`/`bookmarkCount`/`shareCount` are on
 * wildly different scales (tens vs. thousands), so a shared y-axis
 * would flatten the smaller ones. A small grid of single-metric cards
 * also matches this admin's existing visual language (see
 * `RuntimeStatusSection`'s "Last Run/Success/Error" cards and its Queue
 * stats grid) rather than introducing a new chart shape.
 */
export function AdminSparklineCard({ label, points, bucketLabels, total, color = "#2f67e8", formatValue }: AdminSparklineCardProps) {
  const format = formatValue ?? ((value: number) => value.toLocaleString());
  const max = Math.max(1, ...points);
  const min = Math.min(0, ...points);
  const range = max - min || 1;

  const usableWidth = VIEWBOX_WIDTH - PADDING * 2;
  const usableHeight = VIEWBOX_HEIGHT - PADDING * 2;

  const coordinates = points.map((value, index) => {
    const x = points.length > 1 ? PADDING + (index / (points.length - 1)) * usableWidth : PADDING;
    const y = PADDING + usableHeight - ((value - min) / range) * usableHeight;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const hasData = points.some((value) => value > 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{format(total)}</p>
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        width="100%"
        height={VIEWBOX_HEIGHT}
        preserveAspectRatio="none"
        className="mt-3"
        role="img"
        aria-label={`${label} trend`}
      >
        {hasData ? (
          <polyline points={coordinates.join(" ")} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ) : (
          <line x1={PADDING} y1={VIEWBOX_HEIGHT - PADDING} x2={VIEWBOX_WIDTH - PADDING} y2={VIEWBOX_HEIGHT - PADDING} stroke="#e2e8f0" strokeWidth={2} />
        )}
      </svg>
      {bucketLabels && bucketLabels.length > 1 && (
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          <span>{bucketLabels[0]}</span>
          <span>{bucketLabels[Math.floor(bucketLabels.length / 2)]}</span>
          <span>{bucketLabels[bucketLabels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}
