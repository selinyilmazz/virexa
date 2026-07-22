import type { TechnologyRelease } from "@/data/releases";
import { ReleaseActions } from "@/components/releases/ReleaseActions";

/** Same channel-badge palette as the homepage's `LatestReleases` widget (`STATUS_BADGE_CLASSES`) - Stable=green, Beta=amber, RC=purple, LTS=blue - kept visually consistent between the widget row and this page. */
const STATUS_BADGE_CLASSES: Record<TechnologyRelease["status"], string> = {
  Stable: "bg-emerald-50 text-emerald-700",
  Beta: "bg-amber-50 text-amber-700",
  RC: "bg-purple-50 text-purple-700",
  LTS: "bg-blue-50 text-blue-700",
};

/** Hero Card (requirement 2): logo, name, status badge, short description, a 4-up metadata row (Latest Version / Release Date / Maintainer / Type), and the Bookmark + Share row. */
export function ReleaseHero({ release }: { release: TechnologyRelease }) {
  // `T00:00:00` forces local-time parsing of the plain `yyyy-mm-dd` date -
  // without it, JS parses a bare date as UTC midnight, which can render as
  // the previous day in any timezone behind UTC.
  const releaseDate = new Date(`${release.releaseDate}T00:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-5">
          <div className={`flex size-16 shrink-0 items-center justify-center rounded-2xl ${release.logo.bg} ${release.logo.fg}`}>
            {release.logo.content}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{release.name}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[release.status]}`}>{release.status}</span>
            </div>
            <p className="mt-2 max-w-2xl text-base text-slate-600">{release.description}</p>
          </div>
        </div>

        <ReleaseActions techSlug={release.slug} technologyName={release.name} />
      </div>

      <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-slate-100 pt-6 sm:grid-cols-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Latest Version</dt>
          <dd className="mt-1 text-sm font-bold text-slate-950">{release.version}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Release Date</dt>
          <dd className="mt-1 text-sm font-bold text-slate-950">{releaseDate}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Maintainer</dt>
          <dd className="mt-1 truncate text-sm font-bold text-slate-950">{release.maintainer}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Type</dt>
          <dd className="mt-1 text-sm font-bold text-slate-950">{release.type}</dd>
        </div>
      </dl>
    </div>
  );
}
