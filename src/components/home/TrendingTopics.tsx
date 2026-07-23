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
 * Product polishing phase (3rd pass): back in the sidebar ("Trending
 * Topics'i tekrar sağ sidebar'a taşı"), so each card is now a full-width
 * row rather than a grid tile. Card content is unchanged from the 2nd
 * pass's compact redesign (icon + name, article count, trend badge +
 * sparkline) - only the layout direction changed, per "kart tasarımı
 * güzel, sadece daha kompakt yap": name/badge share one row, count/
 * sparkline share the next, so the whole card is about two-thirds the
 * height of the earlier standalone-grid version.
 */
function TrendingTopicCard({ topic }: { topic: TrendingCategoryStat | TrendingTopic }) {
  const categoryHref = findCategoryHref(topic.name);

  return (
    <li className="rounded-xl border border-slate-200 p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <Link href={categoryHref} className="group flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm">
          {topic.icon}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-950 group-hover:text-slate-700">
          {topic.name}
        </span>
        <TrendBadge direction={topic.trendDirection} percent={topic.trendPercent} />
      </Link>

      <div className="mt-1.5 flex items-center justify-between gap-2 pl-10">
        <span className="text-xs font-medium text-slate-500">{topic.articleCount}</span>
        <Sparkline values={topic.sparkline} trendDirection={topic.trendDirection} className="shrink-0" />
      </div>
    </li>
  );
}

/**
 * "Trending Topics" - the top section of the homepage's unified right
 * sidebar card (product polishing phase, 3rd pass, layout correction
 * #3: "Sağ sütun tek bir bütün gibi görünmeli" - Trending Topics and
 * Trending Companies now live inside ONE shared bordered card, rendered
 * together by `app/page.tsx` with a divider between them, so this
 * component itself carries no border/padding/shadow of its own -
 * whoever composes it is responsible for the shared card chrome). Real
 * data via `getTrendingCategories` (`article-read-service.ts`); falls
 * back to the curated static list (`data/trendingTopics.ts`) only when
 * the database has no articles yet.
 */
export async function TrendingTopics() {
  const realTopics = await getTrendingCategories(6);
  const topics: (TrendingCategoryStat | TrendingTopic)[] = realTopics.length > 0 ? realTopics : trendingTopics;

  return (
    <section aria-labelledby="trending-topics-title">
      <div className="px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">This Week</p>
        <h2 id="trending-topics-title" className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          🔥 Trending Topics
        </h2>
      </div>
      <ol className="mt-4 space-y-2">
        {topics.map((topic) => (
          <TrendingTopicCard key={topic.rank} topic={topic} />
        ))}
      </ol>
    </section>
  );
}
