import { DEVELOPER_PULSE_DATA, type PulseTopicKey, type PulseTrend } from "@/lib/explorer/developer-pulse-data";

function formatCount(value: number): string {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

const TREND_STYLES: Record<PulseTrend, { arrow: string; className: string }> = {
  up: { arrow: "↗", className: "text-emerald-600" },
  down: { arrow: "↘", className: "text-rose-500" },
  flat: { arrow: "→", className: "text-slate-400" },
};

function HeartIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 21s-6.7-4.35-9.3-8.2C1.02 10.4 1.6 7 4.6 5.6c2.2-1 4.6-.2 5.9 1.6l1.5 2 1.5-2c1.3-1.8 3.7-2.6 5.9-1.6 3 1.4 3.58 4.8 1.9 7.2C18.7 16.65 12 21 12 21Z" />
    </svg>
  );
}

function CommentIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-4-.99L3 20l1.02-4.06A8.4 8.4 0 0 1 3.5 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" />
    </svg>
  );
}

type DeveloperPulseProps = { topic: PulseTopicKey };

/**
 * The Explorer template's ENTIRE right sidebar (premium redesign pass) -
 * previously three separate widgets (Trending Topics / Most Read Today /
 * Top Sources), replaced with this single high-value panel per explicit
 * user instruction ("Do NOT create multiple widgets. Everything should
 * be inside a single 'Developer Pulse' card."). Shows what developers are
 * currently discussing, scoped to whatever page you're on - see
 * `DEVELOPER_PULSE_DATA`'s doc comment for why this is realistic mock
 * data rather than a real social-listening integration (none exists yet)
 * or a fabricated "real" source.
 */
export function DeveloperPulse({ topic }: DeveloperPulseProps) {
  const data = DEVELOPER_PULSE_DATA[topic];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center gap-1.5">
        <span aria-hidden="true" className="text-base leading-none">
          🔥
        </span>
        <h2 className="text-base font-bold tracking-tight text-slate-950">Developer Pulse</h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">What developers are discussing today</p>

      <ul className="mt-4 space-y-0.5">
        {data.topics.map((item) => {
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

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true" className="text-sm leading-none">
            💬
          </span>
          <h3 className="text-sm font-bold tracking-tight text-slate-950">Top Discussion</h3>
        </div>

        <div className="group mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm">
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white ${data.discussion.sourceColor}`}
            >
              {data.discussion.sourceInitials}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400">{data.discussion.source}</p>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">&ldquo;{data.discussion.quote}&rdquo;</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <HeartIcon className="size-3.5 text-rose-500" />
              {formatCount(data.discussion.likes)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CommentIcon className="size-3.5 text-slate-400" />
              {data.discussion.comments.toLocaleString("en-US")} comments
            </span>
          </div>

          <a
            href={data.discussion.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#2f67e8] transition-colors duration-150 hover:text-[#2556c9]"
          >
            View discussion
            <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
