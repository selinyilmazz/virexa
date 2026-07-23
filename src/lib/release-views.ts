"use client";

import { useEffect, useState } from "react";

/**
 * Real, distinct-technology view counter for the Developer Release Detail
 * page - backs the Profile page's "Developer Releases Viewed" stat. There
 * is no server-side view-tracking table for releases (unlike articles'
 * `article_metrics.view_count`), so this counts real page opens on THIS
 * browser via a localStorage Set, the same honest, self-contained pattern
 * `release-bookmarks.ts` already uses for saved releases - a real count of
 * distinct technologies actually opened, never a fabricated number.
 */

const STORAGE_KEY = "virexa:release-views";

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
    // Storage unavailable (private mode, quota) - the count just won't persist across reloads.
  }
}

/** Called once when a Release Detail page mounts (see `ReleaseHero.tsx`). Adds `techSlug` to the distinct-views set if not already present. */
export function recordReleaseView(techSlug: string): void {
  const current = readAll();
  if (!current.includes(techSlug)) {
    writeAll([...current, techSlug]);
  }
}

/** Client hook: count of distinct technologies viewed on this browser. Starts at 0 on the server/first paint (no hydration mismatch), resolves after mount. */
export function useReleaseViewCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(readAll().length);
  }, []);

  return count;
}
