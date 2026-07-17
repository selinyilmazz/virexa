import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserSettingsRow, UserSettingsUpdate } from "@/types/database";
import type { UserSettings } from "@/types/settings";

function toUserSettings(row: UserSettingsRow): UserSettings {
  return {
    darkMode: row.dark_mode,
    language: row.language,
    summaryLength: row.summary_length,
    preferredCategories: row.preferred_categories,
    notifications: row.notifications,
    emailPreferences: row.email_preferences,
    privacy: row.privacy,
    autoPlayVideos: row.auto_play_videos,
    compactView: row.compact_view,
    openLinksInNewTab: row.open_links_in_new_tab,
  };
}

function toRowUpdate(settings: Partial<UserSettings>): UserSettingsUpdate {
  const update: UserSettingsUpdate = {};
  if (settings.darkMode !== undefined) update.dark_mode = settings.darkMode;
  if (settings.language !== undefined) update.language = settings.language;
  if (settings.summaryLength !== undefined) update.summary_length = settings.summaryLength;
  if (settings.preferredCategories !== undefined) update.preferred_categories = settings.preferredCategories;
  if (settings.notifications !== undefined) update.notifications = settings.notifications;
  if (settings.emailPreferences !== undefined) update.email_preferences = settings.emailPreferences;
  if (settings.privacy !== undefined) update.privacy = settings.privacy;
  if (settings.autoPlayVideos !== undefined) update.auto_play_videos = settings.autoPlayVideos;
  if (settings.compactView !== undefined) update.compact_view = settings.compactView;
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
