import { createServiceClient } from "@/lib/supabase/service-client";

/**
 * Runtime (not build-time) check for the exact failure mode documented
 * in `supabase/migrations/0032_settings_schema_reconciliation.sql`'s own
 * comment: `user_settings`/`profiles` columns added by a later migration
 * (0015, 0017, 0032) silently missing from the *live* database because
 * the migration file exists in this repo but was never actually run
 * against that project. When that happens, every Settings/Profile save
 * throws a real Postgres "column ... does not exist" error (see
 * `settings-repository.ts`/`profile-repository.ts` - both `.select("*")
 * .single()` after an upsert, so a missing column surfaces as a thrown
 * error, never a silent no-op) - but that error only ever appears
 * per-request, in one visitor's browser console, for a few seconds. This
 * gives an operator (or an on-call check) a single, explicit, plain-
 * English answer to "is the live schema up to date?" without needing to
 * open Supabase Studio and read `information_schema` by hand.
 *
 * Deliberately selects every column by *name* (not `select("*")`) -
 * PostgREST's error for a missing column names the exact column, which
 * is what makes this diagnostic instead of just "something failed".
 * Uses the service-role client so this reflects the table's real shape,
 * independent of any one user's RLS-visible row (and works even with an
 * empty table - `limit(1)` with zero matching rows is still success).
 */

export type SchemaCheckResult = {
  ok: boolean;
  checkedAt: string;
  tables: {
    table: string;
    ok: boolean;
    missingColumns: string[];
    error?: string;
  }[];
  /** True when the service-role key isn't configured, so this check couldn't run at all - distinct from a real schema problem. */
  skipped: boolean;
};

const EXPECTED_COLUMNS = {
  user_settings: [
    "id",
    "language",
    "timezone",
    "summary_length",
    "preferred_categories",
    "theme",
    "reading_width",
    "reading_progress_bar",
    "remember_scroll_position",
    "notifications",
    "email_preferences",
    "privacy",
    "open_links_in_new_tab",
  ],
  profiles: ["id", "full_name", "username", "bio", "country", "avatar_url"],
} as const;

/** Parses PostgREST's `column "x" of relation "y" does not exist` (Postgres code 42703) down to just the column name, falling back to the raw message for any other shape so nothing is silently dropped. */
function extractMissingColumn(message: string): string | null {
  const match = message.match(/column "(.+?)" of relation "(.+?)" does not exist/i);
  return match ? match[1] : null;
}

export async function checkSettingsSchema(): Promise<SchemaCheckResult> {
  const checkedAt = new Date().toISOString();
  const supabase = createServiceClient();

  if (!supabase) {
    return { ok: false, checkedAt, tables: [], skipped: true };
  }

  const tables = await Promise.all(
    (Object.entries(EXPECTED_COLUMNS) as [keyof typeof EXPECTED_COLUMNS, readonly string[]][]).map(
      async ([table, columns]) => {
        // One request per column, not one comma-joined `select`, on
        // purpose: PostgREST aborts a multi-column select entirely at
        // the *first* missing column, which would hide every other
        // missing column behind a single error. Checking one at a time
        // costs a handful of extra requests (this only runs on-demand,
        // not per page view) in exchange for a complete report.
        const missingColumns: string[] = [];
        let firstUnexpectedError: string | undefined;

        for (const column of columns) {
          const { error } = await supabase.from(table).select(column).limit(1);
          if (!error) continue;

          const missing = extractMissingColumn(error.message);
          if (missing) {
            missingColumns.push(missing);
          } else if (!firstUnexpectedError) {
            firstUnexpectedError = error.message;
          }
        }

        return {
          table,
          ok: missingColumns.length === 0 && !firstUnexpectedError,
          missingColumns,
          error: firstUnexpectedError,
        };
      }
    )
  );

  return { ok: tables.every((t) => t.ok), checkedAt, tables, skipped: false };
}
