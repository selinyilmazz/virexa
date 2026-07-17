import type { ZodError } from "zod";

/**
 * Turns the first validation issue on a `ZodError` into a single short,
 * user-facing message - mirrors `getAuthErrorMessage` in
 * `src/lib/supabase/errors.ts` (one readable sentence, never raw
 * internals) so validation and Supabase errors both surface the same
 * way in the UI (an `AuthToast`).
 */
export function formatZodError(error: ZodError): string {
  const [firstIssue] = error.issues;
  if (!firstIssue) {
    return "Please check the highlighted fields and try again.";
  }
  return firstIssue.message;
}
