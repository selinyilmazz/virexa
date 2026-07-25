import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserSettingsRow, UserSettingsUpdate } from "@/types/database";
import type { UserSettings } from "@/types/settings";

// Not imported from `src/lib/settings.ts` on purpose - that module imports
// `createSettingsRepository` from THIS file, and importing its
// `defaultSettings` back here would create a circular module dependency.
// Kept minimal (only the two jsonb sub-shapes that actually need a
// backward-compatible merge) rather than duplicating the whole
// `UserSettings` default.
const DEFAULT_NOTIFICATIONS: UserSettings["notifications"] = {
  email: true,
  push: false,
  weeklyDigest: true,
  breakingNews: true,
  developerReleases: true,
  securityAlerts: true,
  dailyDigest: false,
  bookmarkReminders: true,
  developerHubUpdates: false,
};

const DEFAULT_PRIVACY: UserSettings["privacy"] = {
  profileVisibility: "private",
  analyticsConsent: true,
  personalizedRecommendations: true,
  trackSearchHistory: true,
  trackReadingHistory: true,
};

const DEFAULT_EMAIL_PREFERENCES: UserSettings["emailPreferences"] = {
  productUpdates: true,
  accountActivity: true,
};

/**
 * Bug fix: "dil değiştirdiğimde hata alıyorum" - selecting a language and
 * saving threw a raw `"Invalid input: expected string, received
 * undefined"` Zod error instead of actually saving. Root cause: several
 * `user_settings` columns (`timezone`, `theme`, `reading_width`,
 * `reading_progress_bar`, `remember_scroll_position`) were added by later
 * migrations (0015/0017) than the original table (0001) - any row/DB
 * whose migrations haven't fully caught up simply omits those keys from
 * `select("*")`'s result, so `row.timezone` etc. come back `undefined`.
 * That `undefined` flowed straight into the Settings form's local state
 * and failed `settingsSchema.safeParse()` on save, regardless of which
 * field the visitor actually touched - `language` sits right next to
 * `timezone` in the same "Language & Region" card, so changing the
 * language was the easiest way to trigger a save and hit it.
 *
 * Fixed the same way `notifications`/`privacy` already handled their own
 * schema-drift/missing-key case (jsonb columns that gained new keys over
 * time): every field now falls back to the same static default
 * `src/lib/settings.ts`'s `defaultSettings` uses, so a row from a
 * partially-migrated table can never produce an `undefined` field again.
 */
function toUserSettings(row: UserSettingsRow): UserSettings {
  return {
    language: row.language ?? "en",
    timezone: row.timezone ?? "UTC",
    summaryLength: row.summary_length ?? "medium",
    preferredCategories: row.preferred_categories ?? ["Technology", "AI"],
    theme: row.theme ?? "light",
    readingWidth: row.reading_width ?? "comfortable",
    readingProgressBar: row.reading_progress_bar ?? true,
    rememberScrollPosition: row.remember_scroll_position ?? false,
    // Merged over the app-level defaults (not just the row's raw jsonb) -
    // `notifications`/`privacy`/`emailPreferences` are schemaless jsonb
    // columns, so a row saved before a new key existed (e.g.
    // `bookmarkReminders`, Navigation/Profile/Settings UX update) simply
    // won't have it yet. Without this merge that key would come back
    // `undefined`, breaking the Settings form's controlled-toggle
    // rendering and failing Zod validation on next save.
    notifications: { ...DEFAULT_NOTIFICATIONS, ...row.notifications },
    emailPreferences: { ...DEFAULT_EMAIL_PREFERENCES, ...row.email_preferences },
    privacy: { ...DEFAULT_PRIVACY, ...row.privacy },
    openLinksInNewTab: row.open_links_in_new_tab ?? true,
  };
}

function toRowUpdate(settings: Partial<UserSettings>): UserSettingsUpdate {
  const update: UserSettingsUpdate = {};
  if (settings.language !== undefined) update.language = settings.language;
  if (settings.timezone !== undefined) update.timezone = settings.timezone;
  if (settings.summaryLength !== undefined) update.summary_length = settings.summaryLength;
  if (settings.preferredCategories !== undefined) update.preferred_categories = settings.preferredCategories;
  if (settings.theme !== undefined) update.theme = settings.theme;
  if (settings.readingWidth !== undefined) update.reading_width = settings.readingWidth;
  if (settings.readingProgressBar !== undefined) update.reading_progress_bar = settings.readingProgressBar;
  if (settings.rememberScrollPosition !== undefined) update.remember_scroll_position = settings.rememberScrollPosition;
  if (settings.notifications !== undefined) update.notifications = settings.notifications;
  if (settings.emailPreferences !== undefined) update.email_preferences = settings.emailPreferences;
  if (settings.privacy !== undefined) update.privacy = settings.privacy;
  if (settings.openLinksInNewTab !== undefined) update.open_links_in_new_tab = settings.openLinksInNewTab;
  return update;
}

/**
 * Data access for the `user_settings` table. Translates between the
 * DB's snake_case columns and the UI-facing camelCase `UserSettings`
 * shape - see `profile-repository.ts` for the reasoning on the
 * `SupabaseClient` parameter.
 */
export function createSettingsRepository(supabase: SupabaseClient<Database>) {
  return {
    async get(userId: string): Promise<UserSettings | null> {
      const { data, error } = await supabase.from("user_settings").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data ? toUserSettings(data) : null;
    },

    /** Upsert so this also works before `on_auth_user_created` has provisioned a row. */
    async upsert(userId: string, patch: Partial<UserSettings>): Promise<UserSettings> {
      const { data, error } = await supabase
        .from("user_settings")
        .upsert({ id: userId, ...toRowUpdate(patch) }, { onConflict: "id" })
        .select("*")
        .single();
      if (error) throw error;
      if (!data) throw new Error("Settings upsert returned no data.");
      return toUserSettings(data);
    },
  };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
