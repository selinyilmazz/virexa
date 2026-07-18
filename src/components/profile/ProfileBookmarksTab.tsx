"use client";

import Link from "next/link";
import { BookmarkCard } from "@/components/bookmarks/BookmarkCard";
import { useBookmarks, useBookmarksError, useBookmarksStatus } from "@/lib/bookmarks";

/**
 * Bookmarks tab content on the Profile page - a lighter view than the
 * full `/bookmarks` page (`BookmarksContent`): no "Clear All" action or
 * big page header here (that's what the dedicated page is for), just
 * the list itself plus a link across to the full page for management.
 * Reuses the same `BookmarkCard` and `useBookmarks()` hook, so both
 * views always agree.
 */
export function ProfileBookmarksTab() {
  const bookmarks = useBookmarks();
  const status = useBookmarksStatus();
  const error = useBookmarksError();

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-sm text-slate-500">
        Loading your bookmarks...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50/40 px-6 py-12 text-center">
        <p className="text-sm font-medium text-red-600">{error ?? "Couldn't load your bookmarks."}</p>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
        <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
          🔖
        </span>
        <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-950">No bookmarks yet</h3>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
          Save articles you want to read later by tapping the bookmark icon on any news card.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2.5">
        {bookmarks.slice(0, 8).map((item) => (
          <BookmarkCard key={item.slug} {...item} />
        ))}
      </div>
      {bookmarks.length > 0 && (
        <Link
          href="/bookmarks"
          className="mt-4 flex w-full items-center justify-center rounded-xl border-2 border-[#2f67e8] px-6 py-2.5 text-sm font-semibold text-[#2f67e8] transition-colors hover:bg-blue-50"
        >
          Manage all bookmarks →
        </Link>
      )}
    </div>
  );
}
