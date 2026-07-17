"use client";

import { useState } from "react";
import Link from "next/link";
import { NewsCard } from "@/components/news/NewsCard";
import { AuthToast } from "@/components/auth/AuthToast";
import { clearBookmarks, retryBookmarks, useBookmarks, useBookmarksError, useBookmarksStatus } from "@/lib/bookmarks";

export function BookmarksContent() {
  const bookmarks = useBookmarks();
  const status = useBookmarksStatus();
  const loadError = useBookmarksError();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function handleClearAll() {
    clearBookmarks().catch(() => {
      setToastMessage("Couldn't clear your bookmarks. Please try again.");
      setTimeout(() => setToastMessage(null), 2500);
    });
  }

  return (
    <div>
      {toastMessage && <AuthToast message={toastMessage} variant="error" />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-4xl font-bold tracking-tight text-slate-950">
            Bookmarks
            <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-[#2f67e8]">
              {bookmarks.length}
            </span>
          </h1>
          <p className="mt-2 text-base text-slate-500">Your saved articles and stories to read later.</p>
        </div>

        {bookmarks.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Clear All
          </button>
        )}
      </div>

      <div className="mt-8">
        {status === "loading" ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-base text-slate-500 shadow-sm">
            Loading your bookmarks...
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-red-200 bg-red-50/40 px-6 py-16 text-center shadow-sm">
            <p className="text-base font-medium text-red-600">{loadError ?? "Couldn't load your bookmarks."}</p>
            <button
              type="button"
              onClick={() => void retryBookmarks()}
              className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
              🔖
            </span>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">No bookmarks yet</h2>
            <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">
              Save articles you want to read later by tapping the bookmark icon on any news card.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2f67e8] px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-[#2556c9]"
            >
              Browse News
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookmarks.map((item) => (
              <NewsCard key={item.slug} {...item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
