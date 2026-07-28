import type { ZodError } from "zod";
import type { TFunction } from "@/i18n/translate";

/**
 * Turns the first validation issue on a `ZodError` into a single short,
 * user-facing message - mirrors `getAuthErrorMessage` in
 * `src/lib/supabase/errors.ts` (one readable sentence, never raw
 * internals) so validation and Supabase errors both surface the same
 * way in the UI (an `AuthToast`). Takes `t` so the generic fallback is
 * localized - the per-field custom messages themselves are already
 * localized strings by the time they reach the schema (see
 * `createProfileSchema`), not resolved here.
 */
export function formatZodError(error: ZodError, t: TFunction): string {
  const [firstIssue] = error.issues;
  if (!firstIssue) {
    return t("validation.genericError");
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
    return t("validation.genericError");
  }
  return firstIssue.message;
}
