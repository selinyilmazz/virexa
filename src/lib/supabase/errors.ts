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
  if (normalized.length === 0) {
    return "Something went wrong. Please try again in a moment.";
  }

  return error.message;
}
