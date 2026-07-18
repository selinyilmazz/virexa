import Link from "next/link";
import { findCategoryHref } from "@/data/article";
import { trendingTopics } from "@/data/trendingTopics";
import type { TrendingTopic } from "@/data/trendingTopics";
import { Sparkline, TREND_COLOR } from "@/components/home/Sparkline";
import { getTrendingCategories } from "@/services/articles/article-read-service";
import type { TrendingCategoryStat } from "@/services/articles/article-read-service";

/** Small colored pill showing this-week-vs-last-week direction - "New" for a category with zero articles last week, an up/down arrow + percent otherwise, "—" for genuinely flat. Color matches the sparkline bars via the shared `TREND_COLOR` scale. */
function TrendBadge({ direction, percent }: { direction: TrendingTopic["trendDirection"]; percent: number }) {
  const color = TREND_COLOR[direction];
  const label = direction === "new" ? "New" : direction === "flat" ? "—" : `${direction === "up" ? "↑" : "↓"} ${percent}%`;

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ color, backgroundColor: `${color}1a` }}
    >
      {label}
    </span>
  );
}

/**
 * Product polishing phase (2nd pass): the "latest article preview" row
 * is gone entirely - it was the single biggest contributor to card
 * height, and duplicated content Latest News/Editor's Picks already
 * cover elsewhere on the page. What's left is a tight 3-row card: icon
 * + name (top), article count (middle), trend badge + sparkline
 * (bottom) - about 30-40% shorter than the previous 4-row version, with
 * no loss of the data that's actually useful for a "which category is
 * heating up" scan.
 */
function TrendingTopicCard({ topic }: { topic: TrendingCategoryStat | TrendingTopic }) {
  const categoryHref = findCategoryHref(topic.name);

  return (
    <li className="rounded-2xl border border-slate-200 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <Link href={categoryHref} className="group flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-base">
          {topic.icon}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-950 group-hover:text-[#2f67e8]">
          {topic.name}
        </span>
      </Link>

      <p className="mt-2 text-xs font-medium text-slate-500">{topic.articleCount}</p>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <Sparkline values={topic.sparkline} trendDirection={topic.trendDirection} className="shrink-0" />
        <TrendBadge direction={topic.trendDirection} percent={topic.trendPercent} />
      </div>
    </li>
  );
}

/**
 * "Trending Topics" - moved out of the old homepage sidebar into the
 * main single-column flow (product polishing phase, 2nd pass: "sadeleştir"
 * - the homepage no longer has a sidebar at all, see `app/page.tsx`), as
 * a full-width row of compact cards right after the Hero. Real data via
 * `getTrendingCategories` (`article-read-service.ts`); falls back to the
 * curated static list (`data/trendingTopics.ts`) only when the database
 * has no articles yet.
 */
export async function TrendingTopics() {
  const realTopics = await getTrendingCategories(6);
  const topics: (TrendingCategoryStat | TrendingTopic)[] = realTopics.length > 0 ? realTopics : trendingTopics;

  return (
    <section aria-labelledby="trending-topics-title" className="mx-auto mt-10 max-w-[1280px]">
      <div className="px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f67e8]">This Week</p>
        <h2 id="trending-topics-title" className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          🔥 Trending Topics
        </h2>
      </div>
      <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {topics.map((topic) => (
          <TrendingTopicCard key={topic.rank} topic={topic} />
        ))}
      </ol>
    </section>
  );
}
