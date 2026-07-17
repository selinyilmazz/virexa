"use client";

import { useBookmarks } from "@/lib/bookmarks";

export function SavedArticlesCount() {
  const bookmarks = useBookmarks();
  return <>{bookmarks.length}</>;
}
