import { useTranslations } from "@/i18n/i18n-provider";

type ProfileStatsProps = {
  bookmarks: number;
  articlesRead: string;
  releasesViewed: number;
  favoriteCategory: string;
};

/**
 * Profile page "STATISTICS" row (redesign): Bookmarks, Articles Read,
 * Developer Releases Viewed, Favorite Category - same card design
 * language as `BookmarksStats`. `releasesViewed` is a real, honest count
 * from `lib/release-views.ts` (a local view counter, not a fabricated
 * number), and `favoriteCategory` falls back to "—" for a reader with no
 * reading history yet rather than guessing.
 */
export function ProfileStats({ bookmarks, articlesRead, releasesViewed, favoriteCategory }: ProfileStatsProps) {
  const t = useTranslations();
  const stats = [
    { label: t("profile.stats.bookmarks"), value: String(bookmarks) },
    { label: t("profile.stats.articlesRead"), value: articlesRead },
    { label: t("profile.stats.releasesViewed"), value: String(releasesViewed) },
    { label: t("profile.stats.favoriteCategory"), value: favoriteCategory },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="truncate text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{stat.value}</p>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
