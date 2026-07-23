type BookmarksStatsProps = {
  total: number;
  articles: number;
  releases: number;
  resources: number;
};

/** Four stat cards (Bookmarks redesign) - same design language as the Profile page's statistic cards. */
export function BookmarksStats({ total, articles, releases, resources }: BookmarksStatsProps) {
  const stats = [
    { label: "Saved Items", value: total },
    { label: "Articles", value: articles },
    { label: "Developer Releases", value: releases },
    { label: "Resources", value: resources },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{stat.value}</p>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
