"use client";

import Link from "next/link";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";
import { formatPublishedDate } from "@/lib/news/date-format";
import { retryReadingHistory, useReadingHistory, useReadingHistoryError, useReadingHistoryStatus } from "@/lib/reading-history";

/**
 * Reading History tab content (product polishing phase, 2nd pass). Each
 * row is a real, per-user read record (`reading_history` table) shown
 * with a "Read {date}" label instead of a published date, so it reads
 * clearly as activity history rather than a second bookmarks list even
 * though the row layout is intentionally similar (same design language).
 */
export function ReadingHistoryList() {
  const history = useReadingHistory();
  const status = useReadingHistoryStatus();
  const error = useReadingHistoryError();

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-sm text-slate-500">
        Loading your reading history...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50/40 px-6 py-12 text-center">
        <p className="text-sm font-medium text-red-600">{error ?? "Couldn't load your reading history."}</p>
        <button
          type="button"
          onClick={() => void retryReadingHistory()}
          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          Retry
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
        <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
          📖
        </span>
        <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-950">No reading history yet</h3>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
          Articles you open will show up here so you can find your way back to them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {history.map((item) => (
        <Link
          key={item.articleId}
          href={`/article/${item.slug}`}
          className="group flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
        >
          <span className="relative size-16 shrink-0 overflow-hidden rounded-xl">
            <NewsImage
              src={item.image}
              fallbackSrc={resolveFallbackImageForCategory(item.category)}
              alt={item.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
              {item.category}
            </span>
            <span className="mt-1.5 line-clamp-2 block text-sm font-semibold leading-snug text-slate-950 group-hover:text-[#2f67e8]">
              {item.title}
            </span>
            <span className="mt-1 block text-xs text-slate-500">Read {formatPublishedDate(item.readAt)}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
