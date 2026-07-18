"use client";

import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { useBookmarks } from "@/lib/bookmarks";
import { useProfile } from "@/lib/profile";
import { HISTORY_LIMIT, useReadingHistory } from "@/lib/reading-history";

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

/**
 * Profile page summary header (product polishing phase, 2nd pass -
 * "daha modern bir kullanıcı profili"): avatar, name, join date, and
 * three at-a-glance stats (saved articles, read articles, top category)
 * in one compact card, replacing the old two-card sidebar
 * (`ProfileSummaryCard` + `ReadingStatsCard` stacked vertically) with a
 * single horizontal strip that sits above the tabs instead of beside
 * them. "Read Articles" and "Top Category" are both now real, per-user
 * data from `reading_history` (see `lib/reading-history.ts`) rather than
 * the previous `bookmarks.length * 3` placeholder heuristic.
 */
export function ProfileHeader() {
  const profile = useProfile();
  const bookmarks = useBookmarks();
  const history = useReadingHistory();
  const topCategory = computeTopCategory(history.map((item) => item.category)) ?? "—";
  const readCount = history.length >= HISTORY_LIMIT ? `${HISTORY_LIMIT}+` : String(history.length);

  const stats = [
    { label: "Saved Articles", value: String(bookmarks.length) },
    { label: "Read Articles", value: readCount },
    { label: "Top Category", value: topCategory },
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
        <ProfileAvatarUpload />

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">{profile.fullName}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{profile.email}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Member since {profile.joinDate}</p>
        </div>

        <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:auto-cols-max sm:grid-flow-col">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center sm:min-w-[110px]">
              <p className="truncate text-lg font-bold text-slate-950">{stat.value}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
