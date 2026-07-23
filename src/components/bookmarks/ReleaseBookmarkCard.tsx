"use client";

import Link from "next/link";
import type { TechnologyRelease } from "@/data/releases";
import { useReleaseBookmark } from "@/lib/release-bookmarks";

type ReleaseBookmarkCardProps = {
  release: TechnologyRelease;
};

/**
 * Developer Release bookmark card (Bookmarks redesign) - logo, framework
 * name, version, release date, and the same "View Release →" primary CTA
 * the Release Detail page itself uses. The bookmark icon here doubles as
 * the remove action, same convention `ArticleBookmarkCard`'s
 * `BookmarkButton` already uses.
 */
export function ReleaseBookmarkCard({ release }: ReleaseBookmarkCardProps) {
  const [, toggleSaved] = useReleaseBookmark(release.slug);
  const releaseDate = new Date(`${release.releaseDate}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:p-5">
      <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${release.logo.bg} ${release.logo.fg}`}>{release.logo.content}</div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-bold leading-snug tracking-tight text-slate-950 dark:text-white">{release.name}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">v{release.version}</span>
          <span aria-hidden="true">·</span>
          <span>{releaseDate}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={toggleSaved}
          aria-label="Remove from bookmarks"
          className="flex size-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 transition-colors hover:bg-slate-100"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
            <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
          </svg>
        </button>
        <Link
          href={`/developer-hub/releases/${release.slug}`}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          View Release
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
