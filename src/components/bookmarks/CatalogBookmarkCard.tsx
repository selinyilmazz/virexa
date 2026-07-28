"use client";

import { resolveBrandVisual } from "@/components/developer-hub/brand-icons";
import { removeBookmark, type BookmarkItem, type BookmarkItemType } from "@/lib/bookmarks";
import { useTranslations } from "@/i18n/i18n-provider";

type CatalogBookmarkCardProps = {
  /** A `BookmarkItem` with `type: "course"` or `type: "certification"` - see `CatalogBookmarkButton`'s `toBookmarkItem`. */
  item: BookmarkItem;
};

const VIEW_LABEL_KEYS: Record<string, string> = {
  course: "bookmarks.card.viewCourse",
  certification: "bookmarks.card.viewCertification",
};

/**
 * Course / Certification bookmark card (unified Bookmark Center) - shared
 * by both tabs since a saved course and a saved certification render
 * identically (provider logo, title, provider name, difficulty/price
 * pills, an external CTA to the real course/certification URL). Reads
 * from the shared `bookmarks` table via `lib/bookmarks.ts` like every
 * other saved item - `RepositoryBookmarkCard`'s `meta`-driven convention,
 * catalog specifics (provider, url, difficulty, price) live in `meta`
 * (migration 0015's `item_meta` column, migration 0028's `course`/
 * `certification` item types).
 */
export function CatalogBookmarkCard({ item }: CatalogBookmarkCardProps) {
  const t = useTranslations();
  const meta = item.meta ?? {};
  const provider = meta.provider || item.source;
  const url = meta.url || "#";
  const difficulty = meta.difficulty || "";
  const price = meta.price || "";
  const visual = resolveBrandVisual(provider);
  const type = (item.type ?? "course") as BookmarkItemType;

  function handleRemove() {
    removeBookmark(item.slug, type).catch((err: unknown) => {
      console.error(`Failed to remove ${type} bookmark:`, err);
    });
  }

  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:p-5">
      <span className={`flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 ${visual.bg} ${visual.fg}`}>
        {visual.content}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-bold leading-snug tracking-tight text-slate-950 dark:text-white">{item.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{provider}</span>
          {difficulty && (
            <>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{difficulty}</span>
            </>
          )}
          {price && (
            <>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{price}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleRemove}
          aria-label={t("bookmarks.card.removeAria")}
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
          {t(VIEW_LABEL_KEYS[type] ?? "bookmarks.card.viewDefault")}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}
