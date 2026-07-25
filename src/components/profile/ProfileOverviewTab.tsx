"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "@/i18n/i18n-provider";
import { useBookmarks } from "@/lib/bookmarks";
import { useReleaseViewCount } from "@/lib/release-views";
import { HISTORY_LIMIT, useReadingHistory } from "@/lib/reading-history";
import { formatRelativeDay } from "@/lib/news/date-format";

function computeCategoryCounts(categories: string[]): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  categories.forEach((category) => counts.set(category, (counts.get(category) ?? 0) + 1));
  return [...counts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
}

/**
 * Profile page "OVERVIEW" tab (redesign): "Reading Activity" cards,
 * "Favorite Categories" chips, and a "Recent Reading Timeline" - all
 * derived from real `reading_history`/`bookmarks`/release-view data,
 * no fabricated numbers. There is no tracked "time spent reading"
 * anywhere in the app, so the fourth activity card honestly reports
 * "Articles Read This Week" (a real count) instead of inventing a
 * duration - same "never fabricate data" convention used throughout
 * this app (e.g. `HeaderThemeToggle`'s visual-only dark mode note).
 */
export function ProfileOverviewTab() {
  const t = useTranslations();
  const bookmarks = useBookmarks();
  const history = useReadingHistory();
  const releasesViewed = useReleaseViewCount();

  const readCountLabel = history.length >= HISTORY_LIMIT ? `${HISTORY_LIMIT}+` : String(history.length);

  const readThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return history.filter((item) => new Date(item.readAt).getTime() >= weekAgo).length;
  }, [history]);

  const categoryCounts = useMemo(() => computeCategoryCounts(history.map((item) => item.category)), [history]);
  const timelineItems = history.slice(0, 8);

  const activityCards = [
    { label: t("profile.stats.articlesRead"), value: readCountLabel },
    { label: t("profile.stats.bookmarks"), value: String(bookmarks.length) },
    { label: t("profile.overview.releasesViewed"), value: String(releasesViewed) },
    { label: t("profile.overview.articlesReadThisWeek"), value: String(readThisWeek) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-bold tracking-tight text-slate-950">{t("profile.overview.readingActivity")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {activityCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-bold tracking-tight text-slate-950">{card.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold tracking-tight text-slate-950">{t("profile.overview.favoriteCategories")}</h2>
        {categoryCounts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">{t("profile.overview.favoriteCategoriesEmpty")}</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {categoryCounts.slice(0, 6).map(({ category, count }) => (
              <span
                key={category}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3.5 py-1.5 text-sm font-semibold text-slate-700"
              >
                {category}
                <span className="text-xs font-medium text-slate-500">{count}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold tracking-tight text-slate-950">{t("profile.overview.recentTimeline")}</h2>
        {timelineItems.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">{t("profile.overview.timelineEmpty")}</p>
        ) : (
          <ol className="mt-4 flex flex-col gap-5 border-l-2 border-slate-100 pl-5">
            {timelineItems.map((item) => (
              <li key={item.articleId} className="relative">
                <span className="absolute -left-[26px] top-1 size-2.5 rounded-full bg-slate-300" aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{formatRelativeDay(item.readAt)}</p>
                <Link href={`/article/${item.slug}`} className="mt-1 block text-sm font-semibold text-slate-800 transition-colors hover:text-[#2f67e8]">
                  {item.title}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
