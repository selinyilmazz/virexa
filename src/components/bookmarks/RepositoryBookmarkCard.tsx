"use client";

import { resolveBrandVisual } from "@/components/developer-hub/brand-icons";
import { removeBookmark, type BookmarkItem } from "@/lib/bookmarks";

function formatStat(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

type RepositoryBookmarkCardProps = {
  /** A `BookmarkItem` with `type: "repository"` - see `RepoBookmarkButton`'s `toBookmarkItem`. */
  repo: BookmarkItem;
};

/**
 * Open Source (GitHub repository) bookmark card (Bookmarks page) -
 * repository logo, name, stars, language, and a "View Repository →"
 * primary CTA to the real GitHub URL. Reads from the shared `bookmarks`
 * table via `lib/bookmarks.ts` like every other saved item - repository
 * specifics (stars, language, license, url, brandKey) live in `meta`
 * (see migration 0015's `item_meta` column).
 */
export function RepositoryBookmarkCard({ repo }: RepositoryBookmarkCardProps) {
  const meta = repo.meta ?? {};
  const owner = meta.owner || repo.source;
  const repoName = meta.repoName || repo.title;
  const stars = Number(meta.stars ?? 0);
  const language = meta.language || null;
  const url = meta.url || "#";
  const visual = resolveBrandVisual(meta.brandKey || "github");

  function handleRemove() {
    removeBookmark(repo.slug, "repository").catch((err: unknown) => {
      console.error("Failed to remove repository bookmark:", err);
    });
  }

  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:p-5">
      <span className={`flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 ${visual.bg} ${visual.fg}`}>
        {visual.content}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-bold leading-snug tracking-tight text-slate-950 dark:text-white">
          <span className="text-slate-400 dark:text-slate-500">{owner}/</span>
          {repoName}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true" fill="currentColor">
              <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.1 6.6-5.8-3.1-5.8 3.1 1.1-6.6-4.8-4.6 6.6-.9Z" />
            </svg>
            {formatStat(stars)}
          </span>
          {language && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">{language}</span>
            </>
          )}
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
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          View Repository
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}
