import type { AuthError } from "@supabase/supabase-js";

/**
 * Maps Supabase Auth error messages to short, user-facing copy.
 * Supabase's own message strings are stable enough to pattern-match for
 * the common cases; anything unrecognized falls back to a generic,
 * still-readable message rather than leaking raw API text.
 *
 * Note: Supabase intentionally returns the same "Invalid login
 * credentials" message for both a wrong password and an unregistered
 * email, to avoid revealing which accounts exist - so both of those
 * cases surface the same friendly message below.
 */
export function getAuthErrorMessage(error: AuthError): string {
  const normalized = error.message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }
  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "An account with this email already exists.";
  }
  if (normalized.includes("password should be at least")) {
    return "Password is too short. Please choose a longer password.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "Network error. Please check your connection and try again.";
  }
  if (normalized.includes("provider is not enabled") || normalized.includes("unsupported provider")) {
    // The one legitimate case where "not available" copy is still shown -
    // but now it's driven by a real error Supabase returned (the provider
    // toggle is off in the dashboard), not a hardcoded placeholder that
    // fired unconditionally regardless of configuration.
    return "Google sign-in isn't enabled for this app yet. Please use email and password.";
  }
  if (normalized.includes("session") && (normalized.includes("expired") || normalized.includes("invalid"))) {
    return "Your session has expired. Please sign in again.";
  }
  if (normalized.length === 0) {
    return "Something went wrong. Please try again in a moment.";
  }

  return error.message;
}

/**
 * Maps the `error`/`error_code` query params Supabase (or Google itself)
 * appends to the OAuth callback redirect - a different surface than
 * `getAuthErrorMessage` above, since these never reach the app as a JS
 * `AuthError` object; they arrive as plain URL params on the redirect
 * `src/app/auth/callback/route.ts` forwards to `/signin?authError=...`.
 * Kept in this file (not duplicated elsewhere) so every user-facing auth
 * error - password-based or OAuth - is mapped to friendly copy in one
 * place.
 */
export function getOAuthErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) return null;

  switch (errorCode) {
    case "access_denied":
      return "Google sign-in was cancelled.";
    case "server_error":
    case "temporarily_unavailable":
      return "Google is temporarily unavailable. Please try again in a moment.";
    case "exchange_failed":
      return "We couldn't complete your Google sign-in. Please try again.";
    case "missing_code":
      return "Google sign-in didn't return the expected response. Please try again.";
    default:
      return "Something went wrong signing in with Google. Please try again.";
  }
}
