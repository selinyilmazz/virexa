import { useSyncExternalStore } from "react";

export type BookmarkItem = {
  slug: string;
  image: string;
  category: string;
  title: string;
  description: string;
  source: string;
  publishedDate: string;
};

const STORAGE_KEY = "virexa:bookmarks";
export const BOOKMARKS_EVENT = "virexa:bookmarks-changed";
const EMPTY_BOOKMARKS: BookmarkItem[] = [];

let cache: BookmarkItem[] | null = null;

function readFromStorage(): BookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BookmarkItem[]) : [];
  } catch {
    return [];
  }
}

function getCache(): BookmarkItem[] {
  if (cache === null) {
    cache = readFromStorage();
  }
  return cache;
}

function persist(items: BookmarkItem[]) {
  cache = items;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(BOOKMARKS_EVENT));
  }
}

export function getBookmarks(): BookmarkItem[] {
  return getCache();
}

export function isBookmarked(slug: string): boolean {
  return getCache().some((item) => item.slug === slug);
}

export function addBookmark(item: BookmarkItem) {
  const items = getCache();
  if (items.some((existing) => existing.slug === item.slug)) return;
  persist([item, ...items]);
}

export function removeBookmark(slug: string) {
  persist(getCache().filter((item) => item.slug !== slug));
}

export function toggleBookmark(item: BookmarkItem): boolean {
  const bookmarked = isBookmarked(item.slug);
  if (bookmarked) {
    removeBookmark(item.slug);
    return false;
  }
  addBookmark(item);
  return true;
}

export function clearBookmarks() {
  persist([]);
}

function subscribeToBookmarks(callback: () => void) {
  window.addEventListener(BOOKMARKS_EVENT, callback);
  return () => window.removeEventListener(BOOKMARKS_EVENT, callback);
}

export function useBookmarks(): BookmarkItem[] {
  return useSyncExternalStore(subscribeToBookmarks, getBookmarks, () => EMPTY_BOOKMARKS);
}

export function useIsBookmarked(slug: string): boolean {
  return useSyncExternalStore(
    subscribeToBookmarks,
    () => isBookmarked(slug),
    () => false
  );
}
