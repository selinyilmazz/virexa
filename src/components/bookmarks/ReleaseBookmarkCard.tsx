"use client";

import Link from "next/link";
import { removeBookmark, type BookmarkItem } from "@/lib/bookmarks";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

type ReleaseBookmarkCardProps = {
  /** A `BookmarkItem` with `type: "release"` - see `ReleaseActions`' `toBookmarkItem`. */
  release: BookmarkItem;
};

/**
 * Developer Release bookmark card (unified Bookmark Center) - logo,
 * technology name, version, release date, and the same "View Release →"
 * primary CTA the Release Detail page itself uses. Reads from the shared
 * `bookmarks` table via `lib/bookmarks.ts` like every other saved item now
 * (previously a separate localStorage-only store - see
 * `lib/release-bookmarks.ts`, no longer used) - release specifics
 * (version, status, logo colors) live in `meta` (migration 0015's
 * `item_meta` column), same convention `RepositoryBookmarkCard` uses. The
 * logo's initials are recomputed from the title here rather than storing
 * a `ReactNode` in `item_meta` (which is a plain string bag).
 */
export function ReleaseBookmarkCard({ release }: ReleaseBookmarkCardProps) {
  const meta = release.meta ?? {};
  const version = meta.version || "";
  const bg = meta.bg || "bg-slate-100";
  const fg = meta.fg || "text-slate-600";
  const releaseDate = release.publishedDate
    ? new Date(`${release.publishedDate}T00:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  function handleRemove() {
    removeBookmark(release.slug, "release").catch((err: unknown) => {
      console.error("Failed to remove release bookmark:", err);
    });
  }

  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:p-5">
      <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${bg} ${fg}`}>{initials(release.title)}</div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-bold leading-snug tracking-tight text-slate-950 dark:text-white">{release.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {version && <span className="font-semibold text-slate-700 dark:text-slate-300">v{version}</span>}
          {version && releaseDate && <span aria-hidden="true">·</span>}
          {releaseDate && <span>{releaseDate}</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleRemove}
          aria-label="Remove from bookmarks"
          className="flex size-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 text-[#2f67e8] transition-colors hover:bg-blue-50"
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
