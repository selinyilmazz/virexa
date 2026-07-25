type BookmarksStatsProps = {
  total: number;
  articles: number;
  repositories: number;
  courses: number;
  certifications: number;
  releases: number;
};

/** Stat cards (unified Bookmark Center) - same design language as the Profile page's statistic cards, extended from 4 to 6 to cover every bookmark type. */
export function BookmarksStats({ total, articles, repositories, courses, certifications, releases }: BookmarksStatsProps) {
  const stats = [
    { label: "Saved Items", value: total },
    { label: "Articles", value: articles },
    { label: "Repositories", value: repositories },
    { label: "Courses", value: courses },
    { label: "Certificates", value: certifications },
    { label: "Releases", value: releases },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{stat.value}</p>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
