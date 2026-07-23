"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { createReadingHistoryRepository, type ReadingHistoryRecord } from "@/repositories/reading-history-repository";
import { createUserResourceStore, type ResourceStatus } from "@/lib/cache/resource-store";

/**
 * Read-only client store for `reading_history` (product polishing
 * phase, 2nd pass), mirroring `src/lib/bookmarks.ts`'s shape exactly -
 * same `createUserResourceStore` engine, same `syncXAuthContext`/`useX`
 * naming convention. Unlike bookmarks there is no `add`/`remove`/`toggle`
 * here: rows are written server-side only (`recordArticleRead` in
 * `article-metrics-service.ts`, called from the article detail page),
 * so this module only ever reads.
 */
export type { ReadingHistoryRecord };

const EMPTY_HISTORY: ReadingHistoryRecord[] = [];
/** Also used by the Profile summary header's "Read Articles" stat as the display cap (shown as "30+" once history reaches this many rows), so that stat never needs a second, separate count query. */
export const HISTORY_LIMIT = 30;

// Client-only: repositories/Supabase clients are never touched during SSR.
const supabase = typeof window !== "undefined" ? createClient() : null;
const readingHistoryRepository = supabase ? createReadingHistoryRepository(supabase) : null;

const store = createUserResourceStore<ReadingHistoryRecord[]>({
  defaultValue: EMPTY_HISTORY,
  fetcher: async (userId) => {
    if (!readingHistoryRepository) return EMPTY_HISTORY;
    return readingHistoryRepository.list(userId, HISTORY_LIMIT);
  },
});

/** Called by `AuthProvider` on every auth state change - same convention as `syncBookmarksAuthContext`. */
export function syncReadingHistoryAuthContext(userId: string | null) {
  store.setUser(userId);
}

export function getReadingHistory(): ReadingHistoryRecord[] {
  return store.getState().data;
}

export function getReadingHistoryStatus(): ResourceStatus {
  return store.getState().status;
}

export function getReadingHistoryError(): string | null {
  return store.getState().error;
}

export function retryReadingHistory(): Promise<void> {
  return store.retry();
}

/**
 * Settings/Privacy "Clear Reading History" (Settings redesign). Unlike
 * `clearBookmarks()`, this can't call the repository directly - there is
 * no delete RLS policy for the `authenticated` role on `reading_history`
 * (see migration `0011_reading_history.sql`'s doc comment: every write
 * goes through the service-role client from a trusted server path).
 * Clears the local cache optimistically, then calls the server route
 * that performs the real, service-role-authenticated delete; rolls the
 * cache back to whatever the next background refresh loads if the
 * request fails.
 */
export async function clearReadingHistory(): Promise<void> {
  await store.mutate(
    () => [],
    async () => {
      const response = await fetch("/api/reading-history/clear", { method: "POST" });
      const body = (await response.json().catch(() => ({ ok: false }))) as { ok: boolean };
      if (!response.ok || !body.ok) {
        throw new Error("Failed to clear reading history.");
      }
    }
  );
}

function subscribeToReadingHistory(callback: () => void) {
  return store.subscribe(callback);
}

export function useReadingHistory(): ReadingHistoryRecord[] {
  return useSyncExternalStore(subscribeToReadingHistory, getReadingHistory, () => EMPTY_HISTORY);
}

export function useReadingHistoryStatus(): ResourceStatus {
  return useSyncExternalStore(subscribeToReadingHistory, getReadingHistoryStatus, () => "idle");
}

export function useReadingHistoryError(): string | null {
  return useSyncExternalStore(subscribeToReadingHistory, getReadingHistoryError, () => null);
}
