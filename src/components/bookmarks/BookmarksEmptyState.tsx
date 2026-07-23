import Link from "next/link";

/** Centered empty state (Bookmarks redesign) - "personal reading library, not an empty placeholder" spec. */
export function BookmarksEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-20 text-center shadow-sm">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-3xl">
        📚
      </span>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">No bookmarks yet</h2>
      <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500 dark:text-slate-400">Save articles to read later.</p>
      <Link
        href="/news"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2f67e8] px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-[#2556c9]"
      >
        Browse Articles
      </Link>
    </div>
  );
}
