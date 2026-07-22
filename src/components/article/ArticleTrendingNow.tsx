import { DEVELOPER_PULSE_DATA, type PulseTopicKey, type PulseTrend } from "@/lib/explorer/developer-pulse-data";

function formatCount(value: number): string {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

const TREND_STYLES: Record<PulseTrend, { arrow: string; className: string }> = {
  up: { arrow: "↗", className: "text-emerald-600" },
  down: { arrow: "↘", className: "text-rose-500" },
  flat: { arrow: "→", className: "text-slate-400" },
};

/**
 * Sidebar Card 1 - "Trending Now" (Article Detail redesign). Changes
 * depending on the article's category via `resolvePulseTopicForCategory`
 * - reuses the exact same curated topic data the News Explorer's
 * "Developer Pulse" widget already shows (`DEVELOPER_PULSE_DATA`), just
 * presented as its own standalone card rather than combined with a
 * discussion panel, per this page's "only two cards, each focused"
 * sidebar spec.
 */
export function ArticleTrendingNow({ topic }: { topic: PulseTopicKey }) {
  const { topics } = DEVELOPER_PULSE_DATA[topic];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold tracking-tight text-slate-950">Trending Now</h2>

      <ul className="mt-3 space-y-0.5">
        {topics.map((item) => {
          const trend = TREND_STYLES[item.trend];
          return (
            <li
              key={item.name}
              className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors duration-150 hover:bg-slate-50"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${item.dotColor}`} />
                <span className="truncate text-sm font-semibold text-slate-800">{item.name}</span>
              </span>
              <span className={`flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums ${trend.className}`}>
                <span aria-hidden="true">{trend.arrow}</span>
                {formatCount(item.discussions)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
