import type { PulseTopicKey } from "@/lib/explorer/developer-pulse-data";
import { TOP_DISCUSSIONS, type DiscussionPlatform } from "@/lib/article/article-sidebar-data";

const PLATFORM_META: Record<DiscussionPlatform, { label: string; initials: string; color: string }> = {
  hackernews: { label: "Hacker News", initials: "HN", color: "bg-[#FF6600]" },
  reddit: { label: "Reddit", initials: "r/", color: "bg-[#FF4500]" },
  x: { label: "X", initials: "X", color: "bg-black" },
  github: { label: "GitHub", initials: "GH", color: "bg-[#181717]" },
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

function formatCount(value: number): string {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/**
 * Sidebar Card 2 - "Top Discussions" (Article Detail redesign). NOT
 * another article list - real developer-community conversations from
 * Hacker News/Reddit/X/GitHub Discussions, scoped to the article's topic
 * bucket via `TOP_DISCUSSIONS` (see that file's doc comment for the same
 * "realistic illustrative counts, always a real working URL" convention
 * `DEVELOPER_PULSE_DATA` already established). Capped at 3 per the spec.
 */
export function ArticleTopDiscussions({ topic }: { topic: PulseTopicKey }) {
  const discussions = TOP_DISCUSSIONS[topic].slice(0, 3);
  const viewAllUrl = discussions[0]?.url ?? "https://news.ycombinator.com/";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold tracking-tight text-slate-950">Top Discussions</h2>

      <ul className="mt-3 space-y-2.5">
        {discussions.map((item) => {
          const platform = PLATFORM_META[item.platform];
          return (
            <li key={item.url + item.title}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm"
              >
                <span
                  aria-hidden="true"
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white ${platform.color}`}
                >
                  {platform.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-slate-400">{platform.label}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{item.title}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs font-medium text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <HeartIcon className="size-3.5 text-rose-500" />
                      {formatCount(item.likes)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CommentIcon className="size-3.5 text-slate-400" />
                      {formatCount(item.comments)}
                    </span>
                  </div>
                </div>
              </a>
            </li>
          );
        })}
      </ul>

      <a
        href={viewAllUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#2f67e8] transition-colors duration-150 hover:text-[#2556c9]"
      >
        View all discussions
        <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-1">
          →
        </span>
      </a>
    </div>
  );
}
