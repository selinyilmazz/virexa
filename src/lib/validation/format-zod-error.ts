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
  // "never raw internals" convention: a `min()`/`enum()` custom message
  // (e.g. "Select a language.") is genuinely user-facing and safe to
  // show as-is, but Zod's own default `invalid_type`/`invalid_value`
  // wording ("Invalid input: expected string, received undefined") is an
  // internal implementation detail that leaked to real visitors as a
  // confusing raw error (see `settings-repository.ts`'s `toUserSettings`
  // doc comment for the bug this was actually surfacing) - falls back to
  // the same generic, friendly message used when there's no issue at all.
  if (firstIssue.code === "invalid_type" || firstIssue.code === "invalid_value") {
    return "Please check the highlighted fields and try again.";
  }
  return firstIssue.message;
}
