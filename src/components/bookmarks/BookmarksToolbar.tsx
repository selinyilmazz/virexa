"use client";

import { useTranslations } from "@/i18n/i18n-provider";

export type BookmarksSort = "newest" | "oldest";

type BookmarksToolbarProps = {
  sort: BookmarksSort;
  onSortChange: (sort: BookmarksSort) => void;
};

/**
 * Bookmarks page sort control. The old type filter (`BookmarksFilter`
 * dropdown - All/Articles/Developer Releases/Tutorials/Open Source/
 * Resources) is gone: `BookmarksTabs` now owns that job directly as real
 * tabs (unified Bookmark Center spec). Sort stays a native `<select>`,
 * same Linear/GitHub-flavored input styling used elsewhere in this
 * redesign, fully controlled so `BookmarksContent` owns the actual
 * sorting logic per tab.
 */
export function BookmarksToolbar({ sort, onSortChange }: BookmarksToolbarProps) {
  const t = useTranslations();
  return (
    <label className="relative">
      <span className="sr-only">{t("bookmarks.toolbar.sortAria")}</span>
      <select
        value={sort}
        onChange={(event) => onSortChange(event.target.value as BookmarksSort)}
        className="appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-4 pr-9 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition-colors hover:border-slate-300 focus:border-slate-300 focus:outline-none"
      >
        <option value="newest">{t("bookmarks.toolbar.newest")}</option>
        <option value="oldest">{t("bookmarks.toolbar.oldest")}</option>
      </select>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}
