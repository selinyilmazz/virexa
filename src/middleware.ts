import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isAdminUser } from "@/lib/admin/is-admin";

/** Routes that require a signed-in user (see task: Protected Routes). */
const PROTECTED_PATHS = ["/bookmarks", "/profile", "/settings"];

/** Routes that require a signed-in ADMIN user (see task: Admin Foundation). Checked separately from PROTECTED_PATHS below since a non-admin signed-in user is redirected differently (to "/", not "/signin"). */
const ADMIN_PATHS = ["/admin"];

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
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
