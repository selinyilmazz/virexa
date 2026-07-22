"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Minimal, standalone "saved for later" toggle for the Developer Release
 * Detail page's Bookmark button - deliberately NOT wired into the real
 * `bookmarks` table / `lib/bookmarks.ts` system used for news articles.
 * That system's list UI (`BookmarkCard`) hardcodes a `/article/${slug}`
 * link for every saved item; a saved Technology Detail page isn't an
 * article and has no such route, so reusing it would silently produce a
 * broken link on the real Bookmarks page. Saving a reference/docs page is
 * also a different intent than a news reading queue, so this gets its
 * own tiny, honest, localStorage-backed store instead of overloading the
 * article one or inventing a new database table for a single button.
 */

const STORAGE_KEY = "virexa:release-bookmarks";

function readAll(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeAll(slugs: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Storage unavailable (private mode, quota) - the toggle just won't persist across reloads.
  }
}

/** Client hook: `[isSaved, toggle]` for a given technology slug. Reads localStorage only after mount, so SSR always starts from an honest "not saved" state (no hydration mismatch). */
export function useReleaseBookmark(techSlug: string): [boolean, () => void] {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(readAll().includes(techSlug));
  }, [techSlug]);

  const toggle = useCallback(() => {
    setIsSaved((prev) => {
      const current = readAll();
      const next = prev ? current.filter((slug) => slug !== techSlug) : [...current, techSlug];
      writeAll(next);
      return !prev;
    });
  }, [techSlug]);

  return [isSaved, toggle];
}
