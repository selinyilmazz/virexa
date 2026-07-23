import Link from "next/link";
import type { BookmarksFilter } from "@/components/bookmarks/BookmarksToolbar";

export type RecentBookmarkItem = {
  id: string;
  type: BookmarksFilter;
  title: string;
  href: string;
  external?: boolean;
};

const TYPE_ICON: Record<BookmarksFilter, string> = {
  all: "🔖",
  article: "📰",
  release: "🚀",
  tutorial: "🎓",
  repository: "⭐",
  resource: "🧭",
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
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Recently Bookmarked</h2>
        {recentItems.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">Nothing saved yet.</p>
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
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Reading Statistics</h2>
        <div className="mt-4 flex flex-col gap-3">
          {[
            { label: "Saved", value: saved },
            { label: "Read", value: read },
            { label: "Unread", value: unread },
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
