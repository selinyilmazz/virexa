import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase client for use in Client Components. Cheap to call on every
 * render/interaction - @supabase/ssr's browser client reuses the same
 * underlying auth state (backed by cookies) across instances, so this
 * intentionally does not memoize a singleton itself; callers that need
 * a stable reference (e.g. for a `useEffect` dependency array) should
 * memoize with `useMemo`.
 *
 * Parameterized with `Database` so every `.from("table")` call made
 * through this client (see `src/repositories/*`) is typed against the
 * real production schema.
 */
export function createClient() {
  return createBrowserClient<Database>(env.supabase.url ?? "", env.supabase.anonKey ?? "");
}
