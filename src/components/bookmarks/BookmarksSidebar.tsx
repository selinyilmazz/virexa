"use client";

import Link from "next/link";
import type { BookmarksTabId } from "@/components/bookmarks/BookmarksTabs";
import { useTranslations } from "@/i18n/i18n-provider";

export type RecentBookmarkItem = {
  id: string;
  type: BookmarksTabId;
  title: string;
  href: string;
  external?: boolean;
};

const TYPE_ICON: Record<BookmarksTabId, string> = {
  article: "📰",
  release: "🚀",
  repository: "⭐",
  course: "🎓",
  certification: "🏅",
};

type BookmarksSidebarProps = {
  recentItems: RecentBookmarkItem[];
  saved: number;
  read: number;
  unread: number;
};

/**
 * Bookmarks page right sidebar - spec: "only two widgets: Recently
 * Bookmarked and Reading Statistics. No advertisements. No unrelated
 * widgets." `read`/`unread` come from cross-referencing saved article
 * slugs against real `reading_history` rows (see `BookmarksContent.tsx`),
 * not a fabricated split.
 */
export function BookmarksSidebar({ recentItems, saved, read, unread }: BookmarksSidebarProps) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t("bookmarks.sidebar.recentTitle")}</h2>
        {recentItems.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">{t("bookmarks.sidebar.recentEmpty")}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {recentItems.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <Link
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className="group flex items-start gap-2.5"
                >
                  <span aria-hidden="true" className="mt-0.5 shrink-0 text-base">
                    {TYPE_ICON[item.type]}
                  </span>
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-slate-700 dark:text-slate-300 transition-colors group-hover:text-[#2f67e8]">
                    {item.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t("bookmarks.sidebar.statsTitle")}</h2>
        <div className="mt-4 flex flex-col gap-3">
          {[
            { label: t("bookmarks.sidebar.saved"), value: saved },
            { label: t("bookmarks.sidebar.read"), value: read },
            { label: t("bookmarks.sidebar.unread"), value: unread },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
              <span className="font-bold text-slate-950 dark:text-white">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
