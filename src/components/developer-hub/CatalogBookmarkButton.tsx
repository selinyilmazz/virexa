"use client";

import { useBookmarkAction } from "@/hooks/useBookmarkAction";
import { AuthToast } from "@/components/auth/AuthToast";
import type { BookmarkItem } from "@/lib/bookmarks";
import { useTranslations } from "@/i18n/i18n-provider";

export type CatalogBookmarkInput = {
  /** `catalog_items.id` - stable regardless of edits, same role `RepoBookmarkButton` gives `owner/repo`. */
  id: string;
  title: string;
  description: string;
  provider: string;
  url: string;
  resourceType: "course" | "certification";
  difficulty?: string;
  price?: string;
};

function toBookmarkItem(item: CatalogBookmarkInput): BookmarkItem {
  return {
    slug: item.id,
    image: "",
    category: item.provider,
    title: item.title,
    description: item.description,
    source: item.provider,
    publishedDate: "",
    type: item.resourceType,
    meta: {
      provider: item.provider,
      url: item.url,
      difficulty: item.difficulty ?? "",
      price: item.price ?? "",
    },
  };
}

/**
 * Small icon-only "Save" toggle for Course/Certification catalog cards
 * (`CatalogCard`) - unified Bookmark Center build-out. Backed by the same
 * shared `lib/bookmarks.ts` Supabase-backed store every other bookmark
 * type uses (via `useBookmarkAction`), same convention as
 * `RepoBookmarkButton`, so a saved course/certification shows up on the
 * real Bookmarks page and syncs across devices/logout-login like every
 * other bookmark - no separate storage system.
 */
export function CatalogBookmarkButton({ item }: { item: CatalogBookmarkInput }) {
  const t = useTranslations();
  const bookmarkItem = toBookmarkItem(item);
  const { bookmarked, trigger, error } = useBookmarkAction(bookmarkItem);

  return (
    <>
      {error && <AuthToast message={error} variant="error" />}
      <button
        type="button"
        onClick={trigger}
        aria-pressed={bookmarked}
        aria-label={
          bookmarked
            ? t("developerHub.bookmark.remove")
            : t("developerHub.bookmark.save", { type: t(`developerHub.resourceType.${item.resourceType}`) })
        }
        className={`absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-colors sm:right-5 sm:top-5 ${
          bookmarked ? "bg-[#2f67e8] text-white" : "bg-white/95 text-slate-400 hover:bg-white hover:text-slate-600"
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
          <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
        </svg>
      </button>
    </>
  );
}
