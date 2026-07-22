/**
 * Real, honest backing for the Developer Hub landing page's "Continue
 * Learning" section (premium-polish pass). There is no server-side
 * progress-tracking feature for external Developer Hub resources - we
 * don't control AWS Skill Builder's or Coursera's completion state, so a
 * "75% complete" progress bar would have to be fabricated. Instead this
 * tracks something genuinely real and cheap: which resources the signed-
 * in user has actually clicked into recently, and when - a "recently
 * visited" list, not an invented progress percentage. Namespaced per
 * user id in `localStorage` (same lightweight, no-migration-needed
 * pattern this app used for mock auth/bookmarks before the real Supabase
 * tables existed), guarded against SSR (`typeof window === "undefined"`)
 * since this is only ever called from Client Components.
 */
export type ContinueLearningEntry = {
  id: string;
  title: string;
  provider: string;
  resourceType: string;
  brandKey: string;
  url: string;
  /** Real ISO timestamp of the most recent click - not a fabricated "Completed yesterday" claim. */
  visitedAt: string;
};

const MAX_ENTRIES = 6;

function storageKey(userId: string): string {
  return `virexa:developer-hub:continue-learning:${userId}`;
}

function readEntries(userId: string): ContinueLearningEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ContinueLearningEntry[]) : [];
  } catch {
    return [];
  }
}

/** Records (or bumps to the top of) a real visit - called from `TrackedResourceLink`'s `onClick` whenever a signed-in user opens a Developer Hub resource. */
export function recordDeveloperHubVisit(userId: string, entry: Omit<ContinueLearningEntry, "visitedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readEntries(userId).filter((item) => item.id !== entry.id);
    const next = [{ ...entry, visitedAt: new Date().toISOString() }, ...existing].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // localStorage can throw in private-browsing/quota-exceeded edge cases - a missed visit record is harmless, never worth breaking the click-through.
  }
}

/** Most-recently-visited resources, newest first - powers "Continue Learning". */
export function getContinueLearning(userId: string, limit = 3): ContinueLearningEntry[] {
  return readEntries(userId).slice(0, limit);
}
