import Link from "next/link";
import { getLatestReleases, type ReleaseStatus } from "@/services/articles/article-read-service";

/** Colored status-badge classes per release channel - Stable=green, Beta=amber, RC=purple, LTS=blue, all real-article-derived (see `classifyReleaseStatus`). */
const STATUS_BADGE_CLASSES: Record<ReleaseStatus, string> = {
  Stable: "bg-emerald-50 text-emerald-700",
  Beta: "bg-amber-50 text-amber-700",
  RC: "bg-purple-50 text-purple-700",
  LTS: "bg-blue-50 text-blue-700",
};

/**
 * "Developer Releases" homepage widget (renamed from "Latest Releases" in
 * Phase F) - framework/tool version rows, each linking to the real
 * article that reported it (see `getLatestReleases()`'s doc comment:
 * every row is a real, currently-stored article's headline, never a
 * fabricated version number). Renders nothing when the database
 * currently has no matching release articles for any watched tool,
 * consistent with every other homepage section's "no fake placeholder
 * content" convention.
 *
 * Phase F additions: a colored Stable/Beta/RC/LTS status badge and a
 * relative publish date ("Yesterday" etc.), both derived from the same
 * real chosen article - see `getLatestReleases`'s `status`/`relativeDate`
 * fields. Expanded from 6 to 7 rows (matches `WATCHED_RELEASES`'s full
 * watch list).
 */
export async function LatestReleases() {
  const releases = await getLatestReleases(7);
  if (releases.length === 0) return null;

  return (
    <section aria-labelledby="latest-releases-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 id="latest-releases-title" className="text-lg font-bold tracking-tight text-slate-950">
          Developer Releases
        </h2>
      </div>

      <ul className="mt-4 space-y-1">
        {releases.map((release) => (
          <li key={release.name}>
            <Link
              href={`/article/${release.slug}`}
              className="flex min-w-0 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                style={{ backgroundColor: release.tileBg, color: release.tileColor }}
              >
                {release.glyph}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-950">{release.name}</span>
                <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
                  <span className="truncate">{release.subtitle}</span>
                  <span aria-hidden="true">·</span>
                  <span className="shrink-0">{release.relativeDate}</span>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {release.version}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE_CLASSES[release.status]}`}>
                  {release.status}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
