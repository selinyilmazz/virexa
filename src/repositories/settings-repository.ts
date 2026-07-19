import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserSettingsRow, UserSettingsUpdate } from "@/types/database";
import type { UserSettings } from "@/types/settings";

function toUserSettings(row: UserSettingsRow): UserSettings {
  return {
    language: row.language,
    summaryLength: row.summary_length,
    preferredCategories: row.preferred_categories,
    notifications: row.notifications,
    emailPreferences: row.email_preferences,
    openLinksInNewTab: row.open_links_in_new_tab,
  };
}

function toRowUpdate(settings: Partial<UserSettings>): UserSettingsUpdate {
  const update: UserSettingsUpdate = {};
  if (settings.language !== undefined) update.language = settings.language;
  if (settings.summaryLength !== undefined) update.summary_length = settings.summaryLength;
  if (settings.preferredCategories !== undefined) update.preferred_categories = settings.preferredCategories;
  if (settings.notifications !== undefined) update.notifications = settings.notifications;
  if (settings.emailPreferences !== undefined) update.email_preferences = settings.emailPreferences;
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
