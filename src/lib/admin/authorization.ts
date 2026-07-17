import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin/is-admin";

/**
 * Server-only defense-in-depth guard for `/admin` pages/layouts, on top
 * of the fast-path check already done in `src/middleware.ts`. Two
 * independent checks are deliberate, not redundant: middleware protects
 * every request at the edge before any React rendering starts, while
 * this guard protects the same routes even if they were ever reached by
 * a path that bypasses middleware (e.g. a future internal fetch/rewrite)
 * - the standard "don't trust a single layer" posture for an admin
 * surface (see requirement 9, "Security").
 *
 * Uses `getUser()` (not `getSession()`), same as `updateSession()` in
 * `lib/supabase/middleware.ts`, so the check revalidates against
 * Supabase rather than trusting a possibly-stale cookie.
 */
export async function requireAdminUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin?redirect=/admin");
  }

  if (!isAdminUser(user)) {
    redirect("/");
  }

  return user;
}

/**
 * Non-redirecting variant for Route Handlers (e.g.
 * `/api/admin/sources/[id]/route.ts`). `redirect()` throws a
 * navigation-flow signal meant for pages/layouts - a JSON API should
 * return a normal 401/403 response instead, so callers use this and
 * decide the response themselves. Returns `null` for both "not signed
 * in" and "signed in but not admin" - the caller doesn't need to
 * distinguish the two for an API 403.
 */
export async function getAdminUserOrNull(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) {
    return null;
  }

  return user;
}
