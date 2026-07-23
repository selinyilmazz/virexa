import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Guards against open redirects - must be an internal path, never protocol-relative. */
function toSafeInternalPath(path: string | null): string {
  if (path && path.startsWith("/") && !path.startsWith("//")) return path;
  return "/";
}

/**
 * OAuth callback (Google today; any future provider added to
 * `src/lib/supabase/oauth.ts` reuses this exact same route - the
 * redirect target Supabase sends the browser back to after the
 * provider's consent screen. Exchanges the one-time `code` for a real
 * session (setting the Supabase auth cookies via the server client, see
 * `src/lib/supabase/server.ts`), then redirects to wherever the user was
 * headed (`next`, defaulting to "/").
 *
 * Two distinct failure paths, both redirected to `/signin?authError=...`
 * rather than rendered here directly - `SignInForm` reads that param and
 * shows a friendly toast (see `getOAuthErrorMessage` in
 * `src/lib/supabase/errors.ts`):
 *  1. The provider itself reports an error (`?error=access_denied` when
 *     the user cancels/denies consent on Google's screen) - no `code` is
 *     ever issued in this case.
 *  2. A `code` is present but `exchangeCodeForSession` fails (expired/
 *     reused code, clock skew, misconfigured provider secret).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError = searchParams.get("error");
  const next = toSafeInternalPath(searchParams.get("next"));

  if (providerError) {
    const redirectUrl = new URL("/signin", origin);
    redirectUrl.searchParams.set("authError", providerError);
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const redirectUrl = new URL("/signin", origin);
  redirectUrl.searchParams.set("authError", code ? "exchange_failed" : "missing_code");
  return NextResponse.redirect(redirectUrl);
}
