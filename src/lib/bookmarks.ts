"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { createBookmarkRepository } from "@/repositories/bookmark-repository";
import { createUserResourceStore, type ResourceStatus } from "@/lib/cache/resource-store";
import { reportArticleMetric } from "@/lib/metrics-client";
import type { BookmarkItemType } from "@/types/database";

export type { BookmarkItemType };

/**
 * Bookmarks, backed by the `bookmarks` table (see
 * `supabase/migrations/0001_production_schema.sql`, extended by
 * `0015_bookmark_types_and_settings.sql`) via
 * `src/repositories/bookmark-repository.ts`. The exported surface
 * (`BookmarkItem`, `getBookmarks`, `isBookmarked`, `addBookmark`,
 * `removeBookmark`, `toggleBookmark`, `clearBookmarks`, `useBookmarks`,
 * `useIsBookmarked`) is unchanged from the previous article-only version
 * for every existing caller: `type`/`meta` are optional and default to
 * `"article"`/`{}`, so every article card across the app keeps working
 * without passing them.
 *
 * `addBookmark`/`removeBookmark` also report to `/api/metrics`
 * ("Bookmark yapılınca bookmark_count güncellensin") - best-effort,
 * fire-and-forget, and never blocks or fails the bookmark action itself
 * if the metrics call fails. That metric is article-specific, so it's
 * only reported for `type === "article"` bookmarks.
 */
export type BookmarkItem = {
  slug: string;
  image: string;
  category: string;
  title: string;
  description: string;
  source: string;
  publishedDate: string;
  /** Defaults to `"article"` when omitted - see this file's doc comment. */
  type?: BookmarkItemType;
  /** Type-specific extras (a release's version, a repository's stars/language/url). Ignored for articles. */
  meta?: Record<string, string>;
};

const EMPTY_BOOKMARKS: BookmarkItem[] = [];

// Client-only: repositories/Supabase clients are never touched during SSR.
const supabase = typeof window !== "undefined" ? createClient() : null;
const bookmarkRepository = supabase ? createBookmarkRepository(supabase) : null;

const store = createUserResourceStore<BookmarkItem[]>({
  defaultValue: EMPTY_BOOKMARKS,
  fetcher: async (userId) => {
    if (!bookmarkRepository) return EMPTY_BOOKMARKS;
    return bookmarkRepository.list(userId);
  },
});

/**
 * Called by `AuthProvider` on every auth state change. Signing out
 * clears bookmarks from the cache immediately (a signed-out visitor
 * must never see a previous user's saved articles); signing in fetches
 * that user's real bookmarks, including ones saved from another device.
 */
export function syncBookmarksAuthContext(userId: string | null) {
  store.setUser(userId);
}

export function getBookmarks(): BookmarkItem[] {
  return store.getState().data;
}

export function getBookmarksStatus(): ResourceStatus {
  return store.getState().status;
}

export function getBookmarksError(): string | null {
  return store.getState().error;
}

export function retryBookmarks(): Promise<void> {
  return store.retry();
}

export function isBookmarked(slug: string, type: BookmarkItemType = "article"): boolean {
  return store.getState().data.some((item) => item.slug === slug && (item.type ?? "article") === type);
}

export async function addBookmark(item: BookmarkItem): Promise<void> {
  const type = item.type ?? "article";
  await store.mutate(
    (current) => (current.some((existing) => existing.slug === item.slug && (existing.type ?? "article") === type) ? current : [item, ...current]),
    async (userId) => {
      if (!bookmarkRepository) throw new Error("Supabase is not configured.");
      await bookmarkRepository.add(userId, { ...item, type, meta: item.meta ?? {} });
    }
  );
  if (type === "article") void reportArticleMetric(item.slug, "bookmark_add");
}

export async function removeBookmark(slug: string, type: BookmarkItemType = "article"): Promise<void> {
  await store.mutate(
    (current) => current.filter((item) => !(item.slug === slug && (item.type ?? "article") === type)),
    async (userId) => {
      if (!bookmarkRepository) throw new Error("Supabase is not configured.");
      await bookmarkRepository.remove(userId, slug, type);
    }
  );
  if (type === "article") void reportArticleMetric(slug, "bookmark_remove");
}

export async function toggleBookmark(item: BookmarkItem): Promise<boolean> {
  const type = item.type ?? "article";
  const bookmarked = isBookmarked(item.slug, type);
  if (bookmarked) {
    await removeBookmark(item.slug, type);
    return false;
  }
  await addBookmark(item);
  return true;
}

export async function clearBookmarks(): Promise<void> {
  await store.mutate(
    () => [],
    async (userId) => {
      if (!bookmarkRepository) throw new Error("Supabase is not configured.");
      await bookmarkRepository.clear(userId);
    }
  );
}

function subscribeToBookmarks(callback: () => void) {
  return store.subscribe(callback);
}

export function useBookmarks(): BookmarkItem[] {
  return useSyncExternalStore(subscribeToBookmarks, getBookmarks, () => EMPTY_BOOKMARKS);
}

export function useBookmarksStatus(): ResourceStatus {
  return useSyncExternalStore(subscribeToBookmarks, getBookmarksStatus, () => "idle");
}

export function useBookmarksError(): string | null {
  return useSyncExternalStore(subscribeToBookmarks, getBookmarksError, () => null);
}

export function useIsBookmarked(slug: string, type: BookmarkItemType = "article"): boolean {
  return useSyncExternalStore(
    subscribeToBookmarks,
    () => isBookmarked(slug, type),
    () => false
  );
}
