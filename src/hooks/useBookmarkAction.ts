"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { toggleBookmark, useIsBookmarked, type BookmarkItem } from "@/lib/bookmarks";

type BookmarkActionOptions = {
  /** If provided, the caller owns error display (e.g. a page-level toast) and this hook won't render its own. */
  onError?: (message: string) => void;
};

/**
 * The single reusable bookmark interaction used by every bookmark toggle
 * in the app - articles (`BookmarkButton`), releases, and repositories
 * (`RepoBookmarkButton`) all go through this one hook instead of each
 * reimplementing the same auth-check/optimistic-toggle/error-handling
 * logic. Centralizes three things that used to be inconsistent across
 * call sites:
 *
 * 1. Signed-out clicks always redirect to sign-in - never a silent no-op.
 * 2. The toggle always goes through `lib/bookmarks.ts`'s Supabase-backed
 *    store (optimistic update, automatic rollback on failure).
 * 3. A failed write is never silently swallowed: the real error is always
 *    logged to the console for debugging, and a friendly, generic
 *    message is always surfaced to the user - either via the caller's
 *    `onError` or this hook's own `error` state, which callers with no
 *    custom error UI can render as-is (see `BookmarkButton`/
 *    `RepoBookmarkButton`). The raw Supabase error text is deliberately
 *    never shown in the UI (only logged) - it can leak internal details
 *    (table/column names, constraint names) that mean nothing to a user
 *    and aren't safe to expose.
 */
const GENERIC_BOOKMARK_ERROR = "Couldn't save bookmark. Please try again.";
export function useBookmarkAction(item: BookmarkItem, options?: BookmarkActionOptions) {
  const type = item.type ?? "article";
  const { user } = useAuth();
  const stored = useIsBookmarked(item.slug, type);
  const bookmarked = user ? stored : false;
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);

  const trigger = useCallback(
    (event?: { preventDefault: () => void; stopPropagation: () => void }) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (!user) {
        router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      // Optimistic: the icon flips immediately. `toggleBookmark` persists
      // to Supabase in the background and rolls the local state back on
      // its own if that write fails - this only handles reporting.
      toggleBookmark(item).catch((err: unknown) => {
        // Logged in full for debugging - never shown to the user (see
        // this file's doc comment on why `GENERIC_BOOKMARK_ERROR` is used
        // for the visible message instead of `err.message`).
        console.error("Failed to update bookmark:", err);
        if (options?.onError) {
          options.onError(GENERIC_BOOKMARK_ERROR);
        } else {
          setError(GENERIC_BOOKMARK_ERROR);
          setTimeout(() => setError(null), 3000);
        }
      });
    },
    [item, user, router, pathname, options]
  );

  return { bookmarked, trigger, error };
}
