/** Shared trend-direction color scale - also used by `TrendingTopicCard`'s trend badge, so the sparkline and the badge always agree visually. */
export const TREND_COLOR: Record<"up" | "down" | "flat" | "new", string> = {
  up: "#16a34a",
  down: "#dc2626",
  flat: "#94a3b8",
  new: "#2f67e8",
};

type SparklineProps = {
  /** Daily counts, oldest to newest - typically the last 7 days. */
  values: number[];
  trendDirection: "up" | "down" | "flat" | "new";
  className?: string;
};

/**
 * Tiny inline-SVG bar sparkline for the redesigned Trending Topics
 * widget - no charting library needed for something this small (7 bars,
 * no axes/legend/interactivity). Bars (not a line) read more clearly at
 * this size and double as the "progress bar" feel the redesign calls
 * for. Color follows the same up/down/flat/new trend direction the
 * widget's arrow badge already shows, so the two reinforce each other
 * at a glance instead of requiring the viewer to read the number.
 */
export function Sparkline({ values, trendDirection, className }: SparklineProps) {
  const max = Math.max(...values, 1);
  const barWidth = 6;
  const gap = 3;
  const height = 28;
  const width = values.length * barWidth + (values.length - 1) * gap;
  const color = TREND_COLOR[trendDirection];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={`Last 7 days activity, trending ${trendDirection}`}
    >
      {values.map((value, index) => {
        const barHeight = Math.max(2, Math.round((value / max) * height));
        const x = index * (barWidth + gap);
        const y = height - barHeight;
        const isLast = index === values.length - 1;
        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={1.5}
            fill={color}
            opacity={isLast ? 1 : 0.35 + (index / values.length) * 0.4}
          />
        );
      })}
    </svg>
  );
}
