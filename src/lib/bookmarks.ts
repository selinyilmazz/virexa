"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { createBookmarkRepository } from "@/repositories/bookmark-repository";
import { createUserResourceStore, type ResourceStatus } from "@/lib/cache/resource-store";
import { reportArticleMetric } from "@/lib/metrics-client";

/**
 * Bookmarks, backed by the `bookmarks` table (see
 * `supabase/migrations/0001_production_schema.sql`) via
 * `src/repositories/bookmark-repository.ts`. The exported surface
 * (`BookmarkItem`, `getBookmarks`, `isBookmarked`, `addBookmark`,
 * `removeBookmark`, `toggleBookmark`, `clearBookmarks`, `useBookmarks`,
 * `useIsBookmarked`) is unchanged from the previous localStorage-backed
 * version - only `addBookmark`/`removeBookmark`/`toggleBookmark`/
 * `clearBookmarks` are now `async` (they were fire-and-forget before
 * too; callers that don't need to know about failures can keep calling
 * them the same way).
 *
 * `addBookmark`/`removeBookmark` also report to `/api/metrics`
 * ("Bookmark yapılınca bookmark_count güncellensin") - best-effort,
 * fire-and-forget, and never blocks or fails the bookmark action itself
 * if the metrics call fails.
 */
export type BookmarkItem = {
  slug: string;
  image: string;
  category: string;
  title: string;
  description: string;
  source: string;
  publishedDate: string;
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

export function isBookmarked(slug: string): boolean {
  return store.getState().data.some((item) => item.slug === slug);
}

export async function addBookmark(item: BookmarkItem): Promise<void> {
  await store.mutate(
    (current) => (current.some((existing) => existing.slug === item.slug) ? current : [item, ...current]),
    async (userId) => {
      if (!bookmarkRepository) throw new Error("Supabase is not configured.");
      await bookmarkRepository.add(userId, item);
    }
  );
  void reportArticleMetric(item.slug, "bookmark_add");
}

export async function removeBookmark(slug: string): Promise<void> {
  await store.mutate(
    (current) => current.filter((item) => item.slug !== slug),
    async (userId) => {
      if (!bookmarkRepository) throw new Error("Supabase is not configured.");
      await bookmarkRepository.remove(userId, slug);
    }
  );
  void reportArticleMetric(slug, "bookmark_remove");
}

export async function toggleBookmark(item: BookmarkItem): Promise<boolean> {
  const bookmarked = isBookmarked(item.slug);
  if (bookmarked) {
    await removeBookmark(item.slug);
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

export function useIsBookmarked(slug: string): boolean {
  return useSyncExternalStore(
    subscribeToBookmarks,
    () => isBookmarked(slug),
    () => false
  );
}
