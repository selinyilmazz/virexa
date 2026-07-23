import Link from "next/link";
import type { TopSourceStat } from "@/services/articles/article-read-service";

type TopSourcesProps = {
  sources: TopSourceStat[];
};

/**
 * Replaces the old "Popular Tags" widget (product polishing phase, area
 * 7 - static, non-clickable pills with no real discovery value). Each
 * row is a real, clickable path to more content: the source's name and
 * how many stories it's contributed to this category, linking through
 * to a full-text search on that source name (`search_articles_fts`
 * already matches on `source` - see `SearchResults.tsx`'s
 * `MATCH_LABELS`), so this doubles as genuine navigation instead of a
 * decorative label cloud.
 */
export function TopSources({ sources }: TopSourcesProps) {
  if (sources.length === 0) return null;

  const maxCount = sources[0].count;

  return (
    <section
      aria-labelledby="top-sources-title"
      className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 id="top-sources-title" className="text-xl font-bold tracking-tight text-slate-950">
        Top Sources
      </h2>
      <p className="mt-1 text-sm text-slate-500">Who's covering this category most</p>

      <ul className="mt-4 space-y-3">
        {sources.map((source) => (
          <li key={source.name}>
            <Link
              href={`/search?q=${encodeURIComponent(source.name)}`}
              className="group block rounded-xl px-1 py-1 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-slate-800 group-hover:text-slate-700">
                  {source.name}
                </span>
                <span className="shrink-0 text-xs font-medium text-slate-400">{source.count}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-400 transition-all group-hover:bg-slate-500"
                  style={{ width: `${Math.max(8, Math.round((source.count / maxCount) * 100))}%` }}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
