"use client";

import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/supabase/errors";
import { env } from "@/lib/env";

/**
 * Every OAuth provider this app supports, mapped to Supabase's own
 * `Provider` id. `SignInForm`/`SignUpForm` both call
 * `signInWithOAuthProvider("google", ...)` - the single, shared entry
 * point for OAuth sign-in, so there is exactly one place that builds the
 * redirect URL and interprets the result. Adding GitHub, Discord, or
 * Microsoft (Azure) later is a two-step change: add the id here, enable
 * the provider in the Supabase Dashboard, and render one more
 * `SocialLoginButtons`-style button that calls the same function with a
 * different id - no new sign-in logic to write.
 */
const SUPPORTED_OAUTH_PROVIDERS = {
  google: "google",
  // github: "github",
  // discord: "discord",
  // microsoft: "azure",
} as const satisfies Record<string, Provider>;

export type OAuthProviderId = keyof typeof SUPPORTED_OAUTH_PROVIDERS;

export type OAuthSignInResult = { ok: true } | { ok: false; message: string };

/** Guards against open redirects, same rule `SignInForm`/`SignUpForm` already apply to the `redirect` query param. */
function toSafeInternalPath(path: string | undefined): string {
  if (path && path.startsWith("/") && !path.startsWith("//")) return path;
  return "/";
}

/**
 * Starts the OAuth flow for `provider`: Supabase redirects the browser to
 * the provider's consent screen, which redirects back to
 * `/auth/callback` (see that route for the other half of this flow),
 * which finally redirects to `redirectAfterSignIn` once the session is
 * established.
 *
 * Resolves to `{ ok: false, message }` only when the flow fails to even
 * START (e.g. the provider is disabled in the Supabase Dashboard, or a
 * network error) - a successful call never resolves at all in practice,
 * since the browser navigates away to the provider's site first.
 */
export async function signInWithOAuthProvider(provider: OAuthProviderId, redirectAfterSignIn?: string): Promise<OAuthSignInResult> {
  const supabase = createClient();

  const callbackUrl = new URL("/auth/callback", env.site.url);
  callbackUrl.searchParams.set("next", toSafeInternalPath(redirectAfterSignIn));

  const { error } = await supabase.auth.signInWithOAuth({
    provider: SUPPORTED_OAUTH_PROVIDERS[provider],
    options: {
      redirectTo: callbackUrl.toString(),
      // Always show the account chooser instead of silently reusing
      // whichever Google account last authorized this browser - avoids a
      // confusing "signed in as the wrong person" surprise.
      queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
    },
  });

  if (error) {
    return { ok: false, message: getAuthErrorMessage(error) };
  }
  return { ok: true };
}
