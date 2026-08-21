import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isAdminUser } from "@/lib/admin/is-admin";
import { isSeoCrawlerUserAgent } from "@/lib/bots/is-bot-request";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { isPortfolioHost } from "@/lib/portfolio-domain";

/** Routes that require a signed-in user (see task: Protected Routes). `/reading-history` is a standalone route now (Navigation/Profile/Settings UX update - was `/profile?tab=history`, gated the same way `/profile` already was). `/developer-releases` is intentionally NOT here - it's a public release catalog (same content as `/developer-hub/releases`), not personal data. */
const PROTECTED_PATHS = ["/bookmarks", "/profile", "/settings", "/reading-history"];

/** Routes that require a signed-in ADMIN user (see task: Admin Foundation). Checked separately from PROTECTED_PATHS below since a non-admin signed-in user is redirected differently (to "/", not "/signin"). */
const ADMIN_PATHS = ["/admin"];

/** Always reachable even when Maintenance Mode is on - admins need `/admin` (to turn it back off) and `/signin` (to reach `/admin`); `/maintenance` is the page itself. Static assets are already excluded by the matcher below. */
const MAINTENANCE_MODE_EXEMPT_PATHS = ["/admin", "/signin", "/maintenance", "/api"];

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Exempt from the SEO-crawler throttle below - a crawler needs to be able to read these to find out it's disallowed at all (see `robots.ts`), and neither is expensive to serve. */
const SEO_CRAWLER_THROTTLE_EXEMPT_PATHS = ["/robots.txt", "/sitemap.xml"];

/**
 * (Traffic-spike defensive measures, "safe middleware throttling for
 * non-search-engine SEO crawlers" - see PERFORMANCE_AUDIT.md) Requests
 * per IP allowed for the narrow `isSeoCrawlerUserAgent` set (Ahrefs/
 * Semrush/Majestic/Moz - never real search engines or AI/LLM crawlers,
 * see that function's doc comment) before they start getting `429`s.
 * Deliberately generous - a well-behaved crawler doing a slow sweep is
 * unaffected; this only caps rapid-fire/aggressive crawling from this
 * specific bot category.
 */
const SEO_CRAWLER_RATE_LIMIT = 12;
const SEO_CRAWLER_RATE_WINDOW_MS = 60_000;

/**
 * Rate-limits the narrow SEO-crawler UA set, cheaply, before any other
 * work in this file runs. Returns a `429` response when the caller is
 * over the limit, `null` otherwise (meaning: proceed as normal). Checked
 * first and separately from `updateSession()`/the rest of `middleware()`
 * below so a throttled request never pays for a Supabase session refresh
 * or reaches the page-render Function - just this cheap, in-memory check
 * and a `429`.
 */
function throttleSeoCrawler(request: NextRequest): NextResponse | null {
  if (SEO_CRAWLER_THROTTLE_EXEMPT_PATHS.includes(request.nextUrl.pathname)) return null;
  if (!isSeoCrawlerUserAgent(request.headers.get("user-agent"))) return null;

  const rateLimit = checkRateLimit(`seo-crawler:${getClientIdentifier(request)}`, SEO_CRAWLER_RATE_LIMIT, SEO_CRAWLER_RATE_WINDOW_MS);
  if (rateLimit.allowed) return null;

  const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
  return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } });
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
  const throttled = throttleSeoCrawler(request);
  if (throttled) return throttled;

  const { pathname } = request.nextUrl;

  /**
   * Personal portfolio domain root - rewritten straight to `/portfolio`
   * before any Virexa-specific logic runs (session refresh, maintenance
   * mode, protected/admin routing). URL bar stays selinyilmaz.dev/
   * (rewrite, not redirect) - only the exact root path is affected, so
   * every other path on this domain (there currently are none) falls
   * through to normal Virexa routing unchanged. The portfolio is
   * intentionally decoupled from the news app's state: it must stay
   * reachable even when Virexa is in Maintenance Mode, and never needs
   * a Supabase session, so this returns before `updateSession()` runs.
   */
  if (pathname === "/" && isPortfolioHost(request.headers.get("host"))) {
    return NextResponse.rewrite(new URL("/portfolio", request.url));
  }

  const { response, user, supabase } = await updateSession(request);
  const { search } = request.nextUrl;

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
