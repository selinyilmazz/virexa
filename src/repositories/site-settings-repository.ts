import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SiteSettingsRow, SiteSettingsUpdate } from "@/types/database";

const SINGLETON_ID = 1;

/** Data access for the singleton `site_settings` row (supabase/migrations/0020_site_settings.sql) - Admin Panel: Settings. */
export function createSiteSettingsRepository(supabase: SupabaseClient<Database>) {
  return {
    async get(): Promise<SiteSettingsRow | null> {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", SINGLETON_ID).maybeSingle();
      if (error) throw error;
      return data;
    },

    async update(patch: SiteSettingsUpdate, updatedBy: string | null): Promise<void> {
      const { error } = await supabase
        .from("site_settings")
        .update({ ...patch, updated_by: updatedBy })
        .eq("id", SINGLETON_ID);
      if (error) throw error;
    },
  };
}

export type SiteSettingsRepository = ReturnType<typeof createSiteSettingsRepository>;
