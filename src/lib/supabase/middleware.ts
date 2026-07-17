import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Refreshes the Supabase auth session on every request and keeps the
 * response's cookies in sync, returning the resolved user so the root
 * `src/middleware.ts` can make protected-route decisions without a
 * second round trip.
 *
 * `supabase.auth.getUser()` (not `getSession()`) is used deliberately:
 * it revalidates the token against Supabase rather than trusting
 * whatever's in the cookie, which is the correct check to gate access
 * with.
 */
export async function updateSession(request: NextRequest): Promise<{ response: NextResponse; user: User | null }> {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
