import Link from "next/link";
import type { BookmarksTabId } from "@/components/bookmarks/BookmarksTabs";

const COPY: Record<BookmarksTabId, { message: string; ctaLabel: string; href: string }> = {
  article: { message: "Save articles to read later.", ctaLabel: "Browse Articles", href: "/news" },
  repository: { message: "Save GitHub repositories to build your own reading library.", ctaLabel: "Browse Repositories", href: "/developer-hub/github" },
  course: { message: "Save courses to pick up right where you left off.", ctaLabel: "Browse Courses", href: "/developer-hub/courses" },
  certification: { message: "Save certifications you're working toward.", ctaLabel: "Browse Certifications", href: "/developer-hub/certifications" },
  release: { message: "Save Developer Releases to keep track of the tools you use.", ctaLabel: "Browse Releases", href: "/developer-hub/releases" },
};

type BookmarksEmptyStateProps = {
  /** Which tab's empty state to render - omit for the page-level "nothing saved at all" state. */
  type?: BookmarksTabId;
};

/** Centered empty state (Bookmarks redesign) - "personal reading library, not an empty placeholder" spec. Per-tab copy (unified Bookmark Center) so an empty Courses tab reads differently than an empty Articles tab. */
export function BookmarksEmptyState({ type }: BookmarksEmptyStateProps) {
  const copy = type ? COPY[type] : { message: "Save articles, repositories, courses, certifications and releases to build your library.", ctaLabel: "Browse Articles", href: "/news" };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-20 text-center shadow-sm">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-3xl">
        📚
      </span>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">No bookmarks yet</h2>
      <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500 dark:text-slate-400">{copy.message}</p>
      <Link
        href={copy.href}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2f67e8] px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-[#2556c9]"
      >
        {copy.ctaLabel}
      </Link>
    </div>
  );
}
