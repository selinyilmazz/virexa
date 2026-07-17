import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Reads/writes the session via Next.js's `cookies()`
 * API. Must be created fresh per request - `cookies()` is
 * request-scoped, so this can't be a module-level singleton.
 *
 * Parameterized with `Database` so every `.from("table")` call made
 * through this client is typed against the real production schema.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabase.url ?? "", env.supabase.anonKey ?? "", {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // `setAll` was called from a Server Component, which can't set
          // cookies directly. This is safe to ignore as long as
          // middleware.ts is also refreshing the session on every
          // request (see src/middleware.ts).
        }
      },
    },
  });
}
