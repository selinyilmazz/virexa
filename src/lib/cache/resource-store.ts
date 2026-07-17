/**
 * Small, generic client-side cache for a single piece of per-user
 * server data (profile, bookmarks, settings). Gives every store built
 * on top of it: an in-memory cache with a TTL (no re-fetching on every
 * render/navigation), optimistic mutations with automatic rollback on
 * failure, a loading/error/success status a component can render
 * against, and automatic reset when the signed-in user changes.
 *
 * This intentionally is NOT a dependency on `@tanstack/react-query`.
 * That package isn't installable in this sandbox (no npm registry
 * access - see the note in `src/types/supabase-shims.d.ts` for the
 * same constraint on Supabase), and the codebase already had this
 * exact "module-level cache + useSyncExternalStore" pattern in
 * `src/lib/profile.ts` / `src/lib/bookmarks.ts` for the localStorage
 * version - this generalizes that existing pattern to Supabase instead
 * of introducing a new one. Swapping a store to real React Query later
 * is a contained change: only `src/lib/profile.ts`,
 * `src/lib/bookmarks.ts`, and `src/lib/settings.ts` would need to
 * change, since every component already goes through their exported
 * hooks rather than touching this file or the repositories directly.
 */

export type ResourceStatus = "idle" | "loading" | "loaded" | "error";

export type ResourceState<T> = {
  data: T;
  status: ResourceStatus;
  error: string | null;
};

type Listener = () => void;

const DEFAULT_TTL_MS = 60_000;

export function createUserResourceStore<T>(options: {
  defaultValue: T;
  /** Fetches the authoritative value for the given signed-in user. */
  fetcher: (userId: string) => Promise<T>;
  /** How long a successful fetch stays fresh before `refresh()` re-fetches. Default 60s. */
  ttlMs?: number;
}) {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;

  let state: ResourceState<T> = { data: options.defaultValue, status: "idle", error: null };
  let currentUserId: string | null = null;
  let lastFetchedAt = 0;
  let inFlight: Promise<void> | null = null;
  const listeners = new Set<Listener>();

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function setState(patch: Partial<ResourceState<T>>) {
    state = { ...state, ...patch };
    notify();
  }

  function getState(): ResourceState<T> {
    return state;
  }

  function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getUserId(): string | null {
    return currentUserId;
  }

  /**
   * Called by the owning store whenever the signed-in user changes
   * (sign in, sign out, or a different account). Signing out clears the
   * cache back to `defaultValue` immediately - signed-out users must
   * never see a previous user's cached data (or vice versa on a shared
   * device). Signing in kicks off a fresh fetch for the new user
   * ("başka cihazdan giriş yaparsa bookmarkları da gelsin").
   */
  function setUser(userId: string | null) {
    if (userId === currentUserId) return;
    currentUserId = userId;
    lastFetchedAt = 0;
    inFlight = null;
    if (!userId) {
      setState({ data: options.defaultValue, status: "idle", error: null });
      return;
    }
    void refresh();
  }

  /**
   * Re-fetches from Supabase. A no-op if data was already fetched
   * within `ttlMs`, unless `force` is set (e.g. a user-triggered Retry
   * button, or right after a mutation elsewhere invalidated the cache).
   */
  async function refresh(refreshOptions?: { force?: boolean }): Promise<void> {
    const userId = currentUserId;
    if (!userId) return;

    const isFresh = state.status === "loaded" && Date.now() - lastFetchedAt < ttlMs;
    if (isFresh && !refreshOptions?.force) return;

    if (inFlight) {
      await inFlight;
      return;
    }

    // Only show a loading state on the very first fetch - a background
    // refresh of already-loaded data shouldn't flash a spinner over
    // content the user is currently looking at.
    setState({ status: state.status === "loaded" ? "loaded" : "loading", error: null });

    const task = (async () => {
      try {
        const data = await options.fetcher(userId);
        if (currentUserId !== userId) return; // user changed mid-flight; discard this response
        lastFetchedAt = Date.now();
        setState({ data, status: "loaded", error: null });
      } catch (error) {
        if (currentUserId !== userId) return;
        console.error("[resource-store] Failed to load data:", error);
        setState({ status: "error", error: error instanceof Error ? error.message : "Failed to load data." });
      } finally {
        inFlight = null;
      }
    })();

    inFlight = task;
    await task;
  }

  /** Force re-fetch, ignoring the TTL - for explicit "Retry" affordances. */
  function retry(): Promise<void> {
    return refresh({ force: true });
  }

  /**
   * Applies `updater` to the cached value immediately (optimistic -
   * the UI reflects the change with no loading state), then runs
   * `persist` in the background. If `persist` throws, the cache is
   * rolled back to its previous value and the error is both surfaced
   * on `state.error` and re-thrown, so a caller can also show a toast.
   */
  async function mutate(updater: (current: T) => T, persist: (userId: string, next: T) => Promise<void>): Promise<void> {
    const userId = currentUserId;
    if (!userId) {
      throw new Error("Cannot mutate: no signed-in user.");
    }

    const previous = state.data;
    const next = updater(previous);
    setState({ data: next, error: null });

    try {
      await persist(userId, next);
    } catch (error) {
      console.error("[resource-store] Mutation failed, rolling back:", error);
      setState({
        data: previous,
        error: error instanceof Error ? error.message : "Failed to save changes.",
      });
      throw error;
    }
  }

  return { getState, subscribe, setUser, getUserId, refresh, retry, mutate };
}

export type UserResourceStore<T> = ReturnType<typeof createUserResourceStore<T>>;
