"use client";

import { useMemo, useState } from "react";
import { getTechnologyRelease } from "@/data/releases";
import { clearBookmarks, retryBookmarks, useBookmarks, useBookmarksError, useBookmarksStatus } from "@/lib/bookmarks";
import { useSavedReleaseSlugs } from "@/lib/release-bookmarks";
import { useReadingHistory } from "@/lib/reading-history";
import { AuthToast } from "@/components/auth/AuthToast";
import { ArticleBookmarkCard } from "@/components/bookmarks/ArticleBookmarkCard";
import { ReleaseBookmarkCard } from "@/components/bookmarks/ReleaseBookmarkCard";
import { RepositoryBookmarkCard } from "@/components/bookmarks/RepositoryBookmarkCard";
import { BookmarksHeader } from "@/components/bookmarks/BookmarksHeader";
import { BookmarksStats } from "@/components/bookmarks/BookmarksStats";
import { BookmarksToolbar, type BookmarksFilter, type BookmarksSort } from "@/components/bookmarks/BookmarksToolbar";
import { BookmarksEmptyState } from "@/components/bookmarks/BookmarksEmptyState";
import { BookmarksSidebar, type RecentBookmarkItem } from "@/components/bookmarks/BookmarksSidebar";

/**
 * Bookmarks page - aggregates every saved-item type into one unified,
 * filterable/sortable "Developer Reading Library" view. Articles and
 * repositories both come from the shared, Supabase-backed
 * `lib/bookmarks.ts` store (`useBookmarks()`, split here by `type`);
 * releases still come from `lib/release-bookmarks.ts`'s separate
 * localStorage store (see that file's doc comment for why - a release
 * isn't `/article/[slug]`-addressable either, same reasoning that used
 * to justify a separate repo store before repos were unified onto the
 * real `bookmarks` table). `tutorial`/`resource` filter options exist
 * per spec but currently have no producer anywhere in the app, so
 * selecting them honestly shows zero results rather than fake items.
 */
export function BookmarksContent() {
  const allBookmarks = useBookmarks();
  const status = useBookmarksStatus();
  const loadError = useBookmarksError();
  const savedReleaseSlugs = useSavedReleaseSlugs();
  const articles = useMemo(() => allBookmarks.filter((item) => (item.type ?? "article") === "article"), [allBookmarks]);
  const savedRepos = useMemo(() => allBookmarks.filter((item) => item.type === "repository"), [allBookmarks]);
  const readingHistory = useReadingHistory();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sort, setSort] = useState<BookmarksSort>("newest");
  const [filter, setFilter] = useState<BookmarksFilter>("all");

  // `articles`/`savedRepos` arrive newest-first from the DB already;
  // `savedReleaseSlugs` is stored oldest-first (new slugs are appended),
  // so it's reversed here to match.
  const releases = useMemo(
    () =>
      [...savedReleaseSlugs]
        .reverse()
        .map((slug) => getTechnologyRelease(slug))
        .filter((release): release is NonNullable<typeof release> => Boolean(release)),
    [savedReleaseSlugs]
  );

  const total = articles.length + releases.length + savedRepos.length;
  const readingHistorySlugs = useMemo(() => new Set(readingHistory.map((entry) => entry.slug)), [readingHistory]);
  const readCount = articles.filter((item) => readingHistorySlugs.has(item.slug)).length;

  const recentItems = useMemo<RecentBookmarkItem[]>(() => {
    const items: RecentBookmarkItem[] = [
      ...articles.map((item) => ({ id: item.slug, type: "article" as const, title: item.title, href: `/article/${item.slug}` })),
      ...releases.map((release) => ({ id: release.slug, type: "release" as const, title: release.name, href: `/developer-hub/releases/${release.slug}` })),
      ...savedRepos.map((repo) => ({ id: repo.slug, type: "repository" as const, title: repo.title, href: repo.meta?.url ?? "#", external: true })),
    ];
    return items.slice(0, 5);
  }, [articles, releases, savedRepos]);

  function handleClearAll() {
    clearBookmarks().catch(() => {
      setToastMessage("Couldn't clear your bookmarks. Please try again.");
      setTimeout(() => setToastMessage(null), 2500);
    });
  }

  const showArticles = filter === "all" || filter === "article";
  const showReleases = filter === "all" || filter === "release";
  const showRepos = filter === "all" || filter === "repository";
  const orderedArticles = sort === "newest" ? articles : [...articles].reverse();
  const orderedReleases = sort === "newest" ? releases : [...releases].reverse();
  const orderedRepos = sort === "newest" ? savedRepos : [...savedRepos].reverse();
  const visibleCount = (showArticles ? orderedArticles.length : 0) + (showReleases ? orderedReleases.length : 0) + (showRepos ? orderedRepos.length : 0);

  return (
    <div>
      {toastMessage && <AuthToast message={toastMessage} variant="error" />}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <BookmarksHeader />
        {total > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="mt-8">
        <BookmarksStats total={total} articles={articles.length} releases={releases.length} resources={savedRepos.length} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {status === "loading" ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-16 text-base text-slate-500 dark:text-slate-400 shadow-sm">
              Loading your bookmarks...
            </div>
          ) : status === "error" ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20 px-6 py-16 text-center shadow-sm">
              <p className="text-base font-medium text-red-600">{loadError ?? "Couldn't load your bookmarks."}</p>
              <button
                type="button"
                onClick={() => void retryBookmarks()}
                className="rounded-xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          ) : total === 0 ? (
            <BookmarksEmptyState />
          ) : (
            <>
              <div className="flex justify-end">
                <BookmarksToolbar sort={sort} onSortChange={setSort} filter={filter} onFilterChange={setFilter} />
              </div>

              <div className="mt-5 space-y-3">
                {showArticles && orderedArticles.map((item) => <ArticleBookmarkCard key={`article-${item.slug}`} {...item} />)}
                {showReleases && orderedReleases.map((release) => <ReleaseBookmarkCard key={`release-${release.slug}`} release={release} />)}
                {showRepos && orderedRepos.map((repo) => <RepositoryBookmarkCard key={`repo-${repo.slug}`} repo={repo} />)}

                {visibleCount === 0 && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400 shadow-sm">
                    No saved items match this filter yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <BookmarksSidebar recentItems={recentItems} saved={total} read={readCount} unread={Math.max(total - readCount, 0)} />
        </aside>
      </div>
    </div>
  );
}
