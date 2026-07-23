import Link from "next/link";
import { OPEN_SOURCE_PULSE } from "@/lib/open-source/pulse-data";
import type { OpenSourceTopic } from "@/services/open-source/open-source-service";

type OpenSourceSidebarProps = {
  topics: OpenSourceTopic[];
  activeTopic?: string;
  buildTopicHref: (topic: string | null) => string;
};

/**
 * Open Source Explorer's sidebar - exactly two cards per spec ("nothing
 * more"): "Explore" (real per-topic repo counts within the tracked pool,
 * clicking one filters the list) and "Open Source Pulse" (illustrative
 * ecosystem stats, see `pulse-data.ts`'s doc comment). Deliberately does
 * NOT reuse `ExplorerSidebar`/`DeveloperPulse` - those are the news-page
 * sidebar widgets this page is explicitly asked not to look like.
 */
export function OpenSourceSidebar({ topics, activeTopic, buildTopicHref }: OpenSourceSidebarProps) {
  const visibleTopics = topics.slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-950 dark:text-white">Explore</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Popular repository topics</p>

        <ul className="mt-4 flex flex-col gap-1">
          {visibleTopics.length === 0 && (
            <li className="text-sm text-slate-400 dark:text-slate-500">No topics yet.</li>
          )}
          {visibleTopics.map((topic) => {
            const isActive = topic.name === activeTopic;
            return (
              <li key={topic.name}>
                <Link
                  href={buildTopicHref(isActive ? null : topic.name)}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 ${
                    isActive
                      ? "bg-[#2f67e8]/10 font-semibold text-[#2f67e8]"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate capitalize">{topic.name.replace(/-/g, " ")}</span>
                  <span className="shrink-0 text-xs font-medium text-slate-400 dark:text-slate-500">{topic.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <Link href="/open-source/topics" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#2f67e8] hover:underline">
          View all topics
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-950 dark:text-white">Open Source Pulse</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Quick ecosystem stats</p>

        <ul className="mt-4 flex flex-col gap-3">
          {OPEN_SOURCE_PULSE.map((metric) => (
            <li key={metric.label} className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-300">{metric.label}</span>
              <span className="flex shrink-0 items-baseline gap-1.5">
                <span className="text-sm font-bold text-slate-950 dark:text-white">{metric.value}</span>
                <span className="text-xs font-semibold text-emerald-600">{metric.changeLabel}</span>
              </span>
            </li>
          ))}
        </ul>

        <a
          href="https://github.com/trending"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#2f67e8] hover:underline"
        >
          View full analytics
          <span aria-hidden="true">→</span>
        </a>
      </section>
    </div>
  );
}
