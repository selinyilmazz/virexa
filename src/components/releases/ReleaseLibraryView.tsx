import Link from "next/link";
import { Header } from "@/components/layout/Header";
import type { TechnologyRelease } from "@/data/releases";

const STATUS_BADGE_CLASSES: Record<TechnologyRelease["status"], string> = {
  Stable: "bg-emerald-50 text-emerald-700",
  Beta: "bg-amber-50 text-amber-700",
  RC: "bg-purple-50 text-purple-700",
  LTS: "bg-blue-50 text-blue-700",
};

type ReleaseLibraryViewProps = {
  releases: TechnologyRelease[];
};

/**
 * The Release Library (`/developer-hub/releases`) - the single, canonical
 * place to browse real software/framework/tool releases (React, Next.js,
 * Docker, Kubernetes, ...), replacing the page that used to render the
 * News Explorer filtered to release-tagged articles at this same URL (a
 * category mismatch: a release overview is documentation, not a news
 * story - see `release-detail-service.ts`'s doc comment). Every card here
 * links to the same `/developer-hub/releases/[slug]` detail page the
 * Home page's "Developer Releases" widget already links to, so there is
 * exactly one release-browsing destination across the app.
 *
 * Deliberately reuses the exact tile/status-badge visual language already
 * established for a `TechnologyRelease` elsewhere (the homepage widget's
 * `LatestReleases` rows, the detail page's own `ReleaseSidebar` "Related
 * Releases" list) and the same page chrome (`Header` + eyebrow/title/
 * subtitle) every other Developer Hub sub-page uses via
 * `CatalogExplorerView` - no new visual language introduced, no filter
 * sidebar invented for a page that doesn't need one (a dozen curated
 * technologies don't need faceted search). The top stats strip
 * (`DeveloperHubStatsStrip`) was removed from this page too, along with
 * every other Developer Hub sub-page - see `CatalogExplorerView`'s doc
 * comment.
 */
export function ReleaseLibraryView({ releases }: ReleaseLibraryViewProps) {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Developer Hub</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Releases</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-500">
              Real, current releases for the frameworks, runtimes and tools developers track most - version, status
              and what changed, sourced from each project's own release.
            </p>
          </div>

          {releases.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              No releases are available right now.
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {releases.map((release) => (
                <Link
                  key={release.slug}
                  href={`/developer-hub/releases/${release.slug}`}
                  className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md sm:p-5"
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 sm:size-16 ${release.logo.bg} ${release.logo.fg}`}
                  >
                    {release.logo.content}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">{release.version}</span>
                      <span className={`rounded-full px-2.5 py-1 font-medium ${STATUS_BADGE_CLASSES[release.status]}`}>{release.status}</span>
                    </div>

                    <h2 className="mt-2 line-clamp-1 text-lg font-bold leading-snug tracking-tight text-slate-950 group-hover:text-[#2f67e8]">
                      {release.name}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">{release.tagline}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{release.maintainer}</span>
                      <span aria-hidden="true">·</span>
                      <span>{release.type}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
