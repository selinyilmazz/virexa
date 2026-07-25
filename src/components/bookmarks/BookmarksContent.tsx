"use client";

import { useEffect, useMemo, useState } from "react";
import { clearBookmarks, retryBookmarks, useBookmarks, useBookmarksError, useBookmarksStatus, type BookmarkItem } from "@/lib/bookmarks";
import { useReadingHistory } from "@/lib/reading-history";
import { AuthToast } from "@/components/auth/AuthToast";
import { ArticleBookmarkCard } from "@/components/bookmarks/ArticleBookmarkCard";
import { ReleaseBookmarkCard } from "@/components/bookmarks/ReleaseBookmarkCard";
import { RepositoryBookmarkCard } from "@/components/bookmarks/RepositoryBookmarkCard";
import { CatalogBookmarkCard } from "@/components/bookmarks/CatalogBookmarkCard";
import { BookmarksHeader } from "@/components/bookmarks/BookmarksHeader";
import { BookmarksStats } from "@/components/bookmarks/BookmarksStats";
import { BookmarksToolbar, type BookmarksSort } from "@/components/bookmarks/BookmarksToolbar";
import { BookmarksTabs, type BookmarksTabId, type BookmarksTabDefinition } from "@/components/bookmarks/BookmarksTabs";
import { BookmarksPagination } from "@/components/bookmarks/BookmarksPagination";
import { BookmarksEmptyState } from "@/components/bookmarks/BookmarksEmptyState";
import { BookmarksSidebar, type RecentBookmarkItem } from "@/components/bookmarks/BookmarksSidebar";
import { useTranslations } from "@/i18n/i18n-provider";

const PAGE_SIZE = 8;

const TAB_ORDER: BookmarksTabId[] = ["article", "repository", "course", "certification", "release"];

/**
 * Bookmarks page - the unified "Bookmark Center". Every content type
 * (articles, GitHub repositories, courses, certifications, Developer
 * Releases) now comes from the exact same Supabase-backed
 * `lib/bookmarks.ts` store (`useBookmarks()`, split here by `item.type`) -
 * no per-type storage system anymore (releases used to live in a separate
 * localStorage store; see `ReleaseActions`'/`ReleaseBookmarkCard`'s doc
 * comments for that migration). Real tabs (`BookmarksTabs`) replace the
 * old single filtered list, each with its own client-side pagination
 * (`BookmarksPagination`) and empty state (`BookmarksEmptyState`) - all
 * bookmarks for the signed-in user are already loaded into memory by the
 * store's one `list()` call, so "pagination" here pages through the
 * already-fetched per-type array rather than re-querying Supabase.
 */
export function BookmarksContent() {
  const t = useTranslations();
  const allBookmarks = useBookmarks();
  const status = useBookmarksStatus();
  const loadError = useBookmarksError();
  const readingHistory = useReadingHistory();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sort, setSort] = useState<BookmarksSort>("newest");
  const [activeTab, setActiveTab] = useState<BookmarksTabId>("article");
  const [page, setPage] = useState(1);

  const byType = useMemo(() => {
    const groups: Record<BookmarksTabId, BookmarkItem[]> = {
      article: [],
      repository: [],
      course: [],
      certification: [],
      release: [],
    };
    for (const item of allBookmarks) {
      const type = (item.type ?? "article") as BookmarksTabId;
      if (type in groups) groups[type].push(item);
    }
    return groups;
  }, [allBookmarks]);

  const total = allBookmarks.length;
  const readingHistorySlugs = useMemo(() => new Set(readingHistory.map((entry) => entry.slug)), [readingHistory]);
  const readCount = byType.article.filter((item) => readingHistorySlugs.has(item.slug)).length;

  const recentItems = useMemo<RecentBookmarkItem[]>(() => {
    const hrefFor = (item: BookmarkItem, type: BookmarksTabId): { href: string; external?: boolean } => {
      if (type === "article") return { href: `/article/${item.slug}` };
      if (type === "release") return { href: `/developer-hub/releases/${item.slug}` };
      return { href: item.meta?.url ?? "#", external: true };
    };
    return [...allBookmarks]
      .slice(0, 5)
      .map((item) => {
        const type = (item.type ?? "article") as BookmarksTabId;
        return { id: item.slug, type, title: item.title, ...hrefFor(item, type) };
      });
  }, [allBookmarks]);

  // Switching tabs (or re-sorting) always lands on page 1 - a stale page
  // number from a longer tab would otherwise render an empty page.
  useEffect(() => {
    setPage(1);
  }, [activeTab, sort]);

  function handleClearAll() {
    clearBookmarks().catch(() => {
      setToastMessage(t("bookmarks.clearAllErrorToast"));
      setTimeout(() => setToastMessage(null), 2500);
    });
  }

  const tabs: BookmarksTabDefinition[] = TAB_ORDER.map((id) => ({ id, label: t(`bookmarks.tabs.${id}`), count: byType[id].length }));
  const activeItems = byType[activeTab];
  const orderedItems = sort === "newest" ? activeItems : [...activeItems].reverse();
  const totalPages = Math.max(1, Math.ceil(orderedItems.length / PAGE_SIZE));
  const pageItems = orderedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function renderCard(item: BookmarkItem) {
    switch (activeTab) {
      case "article":
        return (
          <ArticleBookmarkCard
            key={`article-${item.slug}`}
            slug={item.slug}
            image={item.image}
            category={item.category}
            title={item.title}
            description={item.description}
            source={item.source}
            publishedDate={item.publishedDate}
          />
        );
      case "repository":
        return <RepositoryBookmarkCard key={`repository-${item.slug}`} repo={item} />;
      case "release":
        return <ReleaseBookmarkCard key={`release-${item.slug}`} release={item} />;
      case "course":
      case "certification":
        return <CatalogBookmarkCard key={`${activeTab}-${item.slug}`} item={item} />;
      default:
        return null;
    }
  }

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
            {t("bookmarks.clearAll")}
          </button>
        )}
      </div>

      <div className="mt-8">
        <BookmarksStats
          total={total}
          articles={byType.article.length}
          repositories={byType.repository.length}
          courses={byType.course.length}
          certifications={byType.certification.length}
          releases={byType.release.length}
        />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {status === "loading" ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-16 text-base text-slate-500 dark:text-slate-400 shadow-sm">
              {t("bookmarks.loading")}
            </div>
          ) : status === "error" ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20 px-6 py-16 text-center shadow-sm">
              <p className="text-base font-medium text-red-600">{loadError ?? t("bookmarks.loadError")}</p>
              <button
                type="button"
                onClick={() => void retryBookmarks()}
                className="rounded-xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                {t("common.retry")}
              </button>
            </div>
          ) : total === 0 ? (
            <BookmarksEmptyState />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <BookmarksTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
                <BookmarksToolbar sort={sort} onSortChange={setSort} />
              </div>

              <div className="mt-5 space-y-3">
                {pageItems.length === 0 ? <BookmarksEmptyState type={activeTab} /> : pageItems.map((item) => renderCard(item))}
              </div>

              <BookmarksPagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <BookmarksSidebar recentItems={recentItems} saved={total} read={readCount} unread={Math.max(byType.article.length - readCount, 0)} />
        </aside>
      </div>
    </div>
  );
}
