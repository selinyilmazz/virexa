"use client";

import { useTranslations } from "@/i18n/i18n-provider";

export type BookmarksTabId = "article" | "repository" | "course" | "certification" | "release";

export type BookmarksTabDefinition = {
  id: BookmarksTabId;
  label: string;
  count: number;
};

type BookmarksTabsProps = {
  tabs: BookmarksTabDefinition[];
  active: BookmarksTabId;
  onChange: (tab: BookmarksTabId) => void;
};

/**
 * Bookmarks page tab bar (unified Bookmark Center) - replaces the old
 * single-list-with-a-type-dropdown (`BookmarksToolbar`'s old `filter`
 * select) with five real tabs, one per content type: Articles,
 * Repositories, Courses, Certificates, Releases. Same rounded-xl/border/
 * shadow-sm visual language already used for every pill/button on this
 * page (`ReleaseActions`' Save/Share buttons, `RepoBookmarkButton`) - a
 * new component, but not a new visual language, per the "don't redesign
 * the UI beyond adding the tabs" brief.
 */
export function BookmarksTabs({ tabs, active, onChange }: BookmarksTabsProps) {
  const t = useTranslations();
  return (
    <div role="tablist" aria-label={t("bookmarks.tabs.aria")} className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
              isActive
                ? "border-[#2f67e8] bg-[#2f67e8] text-white"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
