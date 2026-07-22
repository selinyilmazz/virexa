import Link from "next/link";
import type { CategoryNewsItem } from "@/data/categories";
import { getRelatedTechnologyReleases, type TechnologyRelease } from "@/data/releases";
import { SidebarMiniCard } from "@/components/shared/SidebarMiniCard";

const STATUS_BADGE_CLASSES: Record<TechnologyRelease["status"], string> = {
  Stable: "bg-emerald-50 text-emerald-700",
  Beta: "bg-amber-50 text-amber-700",
  RC: "bg-purple-50 text-purple-700",
  LTS: "bg-blue-50 text-blue-700",
};

type ReleaseSidebarProps = {
  release: TechnologyRelease;
  relatedNews: CategoryNewsItem[];
};

/** Right Sidebar (requirement 8): Release Info, Related Releases (latest 3), Related News (3-4 real articles). Each sub-section hides itself when it has nothing to show, rather than rendering an empty card. */
export function ReleaseSidebar({ release, relatedNews }: ReleaseSidebarProps) {
  const relatedReleases = getRelatedTechnologyReleases(release, 3);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold tracking-tight text-slate-950">Release Info</h2>
        <dl className="mt-4 space-y-3.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-slate-500">Version</dt>
            <dd className="font-semibold text-slate-950">{release.version}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-slate-500">Release Date</dt>
            <dd className="font-semibold text-slate-950">
              {new Date(`${release.releaseDate}T00:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-slate-500">Status</dt>
            <dd>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASSES[release.status]}`}>{release.status}</span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <dt className="shrink-0 text-slate-500">Maintainer</dt>
            <dd className="truncate text-right font-semibold text-slate-950">{release.maintainer}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <dt className="shrink-0 text-slate-500">Platform</dt>
            <dd className="truncate text-right font-semibold text-slate-950">{release.platform}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-slate-500">License</dt>
            <dd className="truncate text-right font-semibold text-slate-950">{release.license}</dd>
          </div>
        </dl>
      </div>

      {relatedReleases.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold tracking-tight text-slate-950">Related Releases</h2>
          <ul className="mt-3 space-y-1">
            {relatedReleases.map((related) => (
              <li key={related.slug}>
                <Link
                  href={`/developer-hub/releases/${related.slug}`}
                  className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50"
                >
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${related.logo.bg} ${related.logo.fg}`}>
                    {related.logo.content}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-950 group-hover:text-[#2f67e8]">{related.name}</span>
                    <span className="block truncate text-xs text-slate-500">{related.version}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {relatedNews.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold tracking-tight text-slate-950">Related News</h2>
          <ul className="mt-3 space-y-1">
            {relatedNews.map((item) => (
              <li key={item.slug}>
                <SidebarMiniCard
                  slug={item.slug}
                  image={item.image}
                  category={item.category}
                  title={item.title}
                  source={item.source}
                  publishedDate={item.publishedDate}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
