"use client";

import { useBookmarks } from "@/lib/bookmarks";
import { useProfile } from "@/lib/profile";

function computeFavoriteCategory(categoryList: string[]): string {
  if (categoryList.length === 0) return "Technology";
  const counts = new Map<string, number>();
  categoryList.forEach((category) => counts.set(category, (counts.get(category) ?? 0) + 1));
  let topCategory = categoryList[0];
  let topCount = 0;
  counts.forEach((count, category) => {
    if (count > topCount) {
      topCount = count;
      topCategory = category;
    }
  });
  return topCategory;
}

const bookmarkIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
  </svg>
);

const bookIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path
      d="M4 5.5A1.5 1.5 0 0 1 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM20 5.5A1.5 1.5 0 0 0 18.5 4H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"
      strokeLinejoin="round"
    />
  </svg>
);

const starIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="m12 3 2.6 5.8 6.4.6-4.8 4.3 1.4 6.3L12 16.9l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6L12 3Z" strokeLinejoin="round" />
  </svg>
);

const calendarIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3.5" y="5" width="17" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3.5 10h17" strokeLinecap="round" />
  </svg>
);

export function ReadingStatsCard() {
  const bookmarks = useBookmarks();
  const profile = useProfile();
  const favoriteCategory = computeFavoriteCategory(bookmarks.map((item) => item.category));
  const readArticles = bookmarks.length === 0 ? 0 : bookmarks.length * 3;

  const stats = [
    { label: "Saved Articles", value: bookmarks.length, icon: bookmarkIcon },
    { label: "Read Articles", value: readArticles, icon: bookIcon },
    { label: "Favorite Category", value: favoriteCategory, icon: starIcon },
    { label: "Join Date", value: profile.joinDate, icon: calendarIcon },
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold tracking-tight text-slate-950">Reading Statistics</h2>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2f67e8]">
              {stat.icon}
            </span>
            <p className="mt-3 truncate text-xl font-bold text-slate-950">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
