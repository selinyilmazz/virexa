"use client";

import { useMemo } from "react";
import { useBookmarks } from "@/lib/bookmarks";
import { useReleaseViewCount } from "@/lib/release-views";
import { HISTORY_LIMIT, useReadingHistory } from "@/lib/reading-history";
import { ProfileStats } from "@/components/profile/ProfileStats";

function computeTopCategory(categories: string[]): string | null {
  if (categories.length === 0) return null;
  const counts = new Map<string, number>();
  categories.forEach((category) => counts.set(category, (counts.get(category) ?? 0) + 1));
  let top = categories[0];
  let topCount = 0;
  counts.forEach((count, category) => {
    if (count > topCount) {
      topCount = count;
      top = category;
    }
  });
  return top;
}

/** Client wrapper that reads the four real client-side stores `ProfileStats` needs, so the server-rendered page shell around it stays a plain server component. */
export function ProfileStatsSection() {
  const bookmarks = useBookmarks();
  const history = useReadingHistory();
  const releasesViewed = useReleaseViewCount();

  const topCategory = useMemo(() => computeTopCategory(history.map((item) => item.category)) ?? "—", [history]);
  const readCountLabel = history.length >= HISTORY_LIMIT ? `${HISTORY_LIMIT}+` : String(history.length);

  return <ProfileStats bookmarks={bookmarks.length} articlesRead={readCountLabel} releasesViewed={releasesViewed} favoriteCategory={topCategory} />;
}
