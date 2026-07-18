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
 * Simplified to a clear 3-row hierarchy (product polishing phase, area
 * 5: "cards now feel slightly overcrowded" - the old layout crammed a
 * rank badge, icon, name, count, AND trend badge into one single row).
 * Top row: icon + name + growth badge. Middle: article count, alone on
 * its own line. Bottom: sparkline + latest-article preview. The bottom
 * two rows are indented to align under the name (not the icon), reading
 * as "detail about this topic" rather than competing for the same
 * visual weight as the header row. Same data as before (icon, count,
 * trend badge, sparkline, latest article) - only the rank number was
 * dropped, since the list's own top-to-bottom order already conveys
 * rank without a second, redundant number badge.
 */
function TrendingTopicCard({ topic }: { topic: TrendingCategoryStat | TrendingTopic }) {
  const categoryHref = findCategoryHref(topic.name);

  return (
    <li className="rounded-2xl border border-slate-200 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <Link href={categoryHref} className="group flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">
          {topic.icon}
        </span>
        <span className="min-w-0 flex-1 truncate text-base font-semibold text-slate-950 group-hover:text-[#2f67e8]">
          {topic.name}
        </span>
        <TrendBadge direction={topic.trendDirection} percent={topic.trendPercent} />
      </Link>

      <p className="mt-2 pl-[52px] text-xs font-medium text-slate-500">{topic.articleCount}</p>

      <div className="mt-3 flex items-center gap-3 pl-[52px]">
        <Sparkline values={topic.sparkline} trendDirection={topic.trendDirection} className="shrink-0" />

        {topic.latestArticle ? (
          <Link
            href={`/article/${topic.latestArticle.slug}`}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-1.5 transition-colors hover:bg-blue-50"
          >
            <span
              role="img"
              aria-label=""
              className="size-7 shrink-0 rounded-lg bg-cover bg-center"
              style={{ backgroundImage: `url(${topic.latestArticle.image})` }}
            />
            <span className="truncate text-xs font-medium text-slate-600">{topic.latestArticle.title}</span>
          </Link>
        ) : (
          <span className="flex-1 text-xs text-slate-400">No recent article yet</span>
        )}
      </div>
    </li>
  );
}

/**
 * Premium redesign of the "Trending Topics" widget (product redesign):
 * each row now carries a category icon, a real article count, a
 * this-week-vs-last-week trend badge, a 7-day mini sparkline, and the
 * category's newest article as a tiny inline preview - replacing the
 * old bare rank+count+chevron row. Real data via `getTrendingCategories`
 * (`article-read-service.ts`); falls back to the curated static list
 * (now carrying the same rich shape - see `data/trendingTopics.ts`) only
 * when the database has no articles yet.
 */
export async function TrendingTopics() {
  const realTopics = await getTrendingCategories(6);
  const topics: (TrendingCategoryStat | TrendingTopic)[] = realTopics.length > 0 ? realTopics : trendingTopics;

  return (
    <section
      aria-labelledby="trending-topics-title"
      className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="px-1">
        <h2 id="trending-topics-title" className="text-2xl font-bold tracking-tight text-slate-950">
          🔥 Trending Topics
        </h2>
        <p className="mt-1 text-sm text-slate-500">Most active categories this week</p>
      </div>
      <ol className="mt-4 space-y-3.5">
        {topics.map((topic) => (
          <TrendingTopicCard key={topic.rank} topic={topic} />
        ))}
      </ol>
    </section>
  );
}
