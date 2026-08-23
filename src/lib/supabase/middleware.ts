import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Every cookie `@supabase/ssr` ever sets or reads for auth - on the
 * browser client, the server client, and here - is prefixed `sb-`
 * (project-ref-scoped auth token cookies like `sb-<ref>-auth-token`,
 * chunked into `sb-<ref>-auth-token.0`/`.1` for large tokens on older
 * SDK versions; legacy pre-`@supabase/ssr` cookies like
 * `sb-access-token` share the same prefix too). No `cookieOptions.name`
 * override is configured anywhere in this project (see `client.ts`/
 * `server.ts` - both call `createBrowserClient`/`createServerClient`
 * with no cookie name option), so every session this app has ever
 * issued uses this exact, stable prefix - there is no code path that
 * could produce a differently-prefixed session cookie.
 */
const SUPABASE_COOKIE_PREFIX = "sb-";

/**
 * Refreshes the Supabase auth session on every request and keeps the
 * response's cookies in sync, returning the resolved user (and the
 * client itself) so the root `src/middleware.ts` can make protected-
 * route decisions - including the maintenance-mode read of the public
 * `site_settings` row - without a second client/round trip.
 *
 * `supabase.auth.getUser()` (not `getSession()`) is used deliberately:
 * it revalidates the token against Supabase rather than trusting
 * whatever's in the cookie, which is the correct check to gate access
 * with.
 *
 * (Supabase egress reduction, Ağustos 2026) That revalidation is a real
 * network round trip to Supabase's Auth server, and this function used
 * to make it unconditionally on every single request this middleware's
 * matcher sees - including every anonymous visitor and every bot/
 * crawler hit, none of which carry ANY Supabase cookie at all. If the
 * request has no cookie starting with `SUPABASE_COOKIE_PREFIX`, there
 * is no session for `getUser()` to revalidate - it would return `user:
 * null` regardless, just after spending a network call to find that
 * out. Skipping straight to `user: null` in that case is behaviorally
 * identical, not an approximation: a signed-in visitor's browser always
 * carries this cookie (set by `createBrowserClient` on sign-in), so
 * this short-circuit can only ever trigger for requests that were never
 * going to resolve to a signed-in user in the first place - every
 * authenticated request still takes the exact same `getUser()` path as
 * before.
 */
export async function updateSession(
  request: NextRequest
): Promise<{ response: NextResponse; user: User | null; supabase: SupabaseClient }> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.supabase.url ?? "", env.supabase.anonKey ?? "", {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  const hasSupabaseSessionCookie = request.cookies.getAll().some((cookie) => cookie.name.startsWith(SUPABASE_COOKIE_PREFIX));

  const user = hasSupabaseSessionCookie
    ? (
        await supabase.auth.getUser()
      ).data.user
    : null;

  return { response: supabaseResponse, user, supabase };
}
