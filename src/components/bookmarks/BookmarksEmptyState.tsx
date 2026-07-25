"use client";

import Link from "next/link";
import type { BookmarksTabId } from "@/components/bookmarks/BookmarksTabs";
import { useTranslations } from "@/i18n/i18n-provider";

const HREF: Record<BookmarksTabId, string> = {
  article: "/news",
  repository: "/developer-hub/github",
  course: "/developer-hub/courses",
  certification: "/developer-hub/certifications",
  release: "/developer-hub/releases",
};

type BookmarksEmptyStateProps = {
  /** Which tab's empty state to render - omit for the page-level "nothing saved at all" state. */
  type?: BookmarksTabId;
};

/** Centered empty state (Bookmarks redesign) - "personal reading library, not an empty placeholder" spec. Per-tab copy (unified Bookmark Center) so an empty Courses tab reads differently than an empty Articles tab. */
export function BookmarksEmptyState({ type }: BookmarksEmptyStateProps) {
  const t = useTranslations();
  const key = type ?? "generic";
  const message = t(`bookmarks.emptyState.${key}.message`);
  const ctaLabel = t(`bookmarks.emptyState.${key}.cta`);
  const href = type ? HREF[type] : "/news";

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-20 text-center shadow-sm">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-3xl">
        📚
      </span>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("bookmarks.emptyState.title")}</h2>
      <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500 dark:text-slate-400">{message}</p>
      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2f67e8] px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-[#2556c9]"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
