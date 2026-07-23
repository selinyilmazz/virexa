import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isAdminUser } from "@/lib/admin/is-admin";

/** Routes that require a signed-in user (see task: Protected Routes). `/reading-history` is a standalone route now (Navigation/Profile/Settings UX update - was `/profile?tab=history`, gated the same way `/profile` already was). `/developer-releases` is intentionally NOT here - it's a public release catalog (same content as `/developer-hub/releases`), not personal data. */
const PROTECTED_PATHS = ["/bookmarks", "/profile", "/settings", "/reading-history"];

/** Routes that require a signed-in ADMIN user (see task: Admin Foundation). Checked separately from PROTECTED_PATHS below since a non-admin signed-in user is redirected differently (to "/", not "/signin"). */
const ADMIN_PATHS = ["/admin"];

/** Always reachable even when Maintenance Mode is on - admins need `/admin` (to turn it back off) and `/signin` (to reach `/admin`); `/maintenance` is the page itself. Static assets are already excluded by the matcher below. */
const MAINTENANCE_MODE_EXEMPT_PATHS = ["/admin", "/signin", "/maintenance", "/api"];

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Admin Panel: Settings - "Maintenance Mode" toggle (requirement 12).
 * Reads the singleton `site_settings.maintenance_mode` column via the
 * same anon-key client `updateSession` already built for this request
 * (that table has a public `select` RLS policy - see
 * `supabase/migrations/0020_site_settings.sql`). Fails open (returns
 * `false`) on any error so a transient DB hiccup can never take the
 * whole site down - same "never throws, safe default" convention as
 * every other settings/config read in this app.
 */
async function isMaintenanceModeOn(supabase: Awaited<ReturnType<typeof updateSession>>["supabase"]): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("site_settings").select("maintenance_mode").eq("id", 1).maybeSingle();
    if (error || !data) return false;
    return Boolean((data as { maintenance_mode: boolean }).maintenance_mode);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (matchesPath(pathname, ADMIN_PATHS)) {
    if (!user) {
      const redirectUrl = new URL("/signin", request.url);
      redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(redirectUrl);
    }
    if (!isAdminUser(user)) {
      // Signed in, but not an admin - "Unauthorized kullanıcılar uygun
      // şekilde yönlendirilsin": sent home rather than to /signin, since
      // signing in again wouldn't change the outcome.
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  if (!matchesPath(pathname, MAINTENANCE_MODE_EXEMPT_PATHS) && !isAdminUser(user)) {
    if (await isMaintenanceModeOn(supabase)) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  if (matchesPath(pathname, PROTECTED_PATHS) && !user) {
    const redirectUrl = new URL("/signin", request.url);
    redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on every route except static assets and Next internals, so
    // the Supabase session cookie stays fresh everywhere - matches
    // Supabase's own recommended matcher for @supabase/ssr.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
