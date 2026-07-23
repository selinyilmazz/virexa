import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, DeveloperReleaseInsert, DeveloperReleaseRow, DeveloperReleaseUpdate } from "@/types/database";

/** Data access for the `developer_releases` table (supabase/migrations/0019_developer_releases.sql) - Admin Panel: Developer Releases management. */
export function createReleaseRepository(supabase: SupabaseClient<Database>) {
  return {
    async list(opts?: { visibleOnly?: boolean }): Promise<DeveloperReleaseRow[]> {
      let query = supabase.from("developer_releases").select("*");
      if (opts?.visibleOnly) query = query.eq("visible", true);
      const { data, error } = await query.order("release_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async getById(id: string): Promise<DeveloperReleaseRow | null> {
      const { data, error } = await supabase.from("developer_releases").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async getBySlug(slug: string): Promise<DeveloperReleaseRow | null> {
      const { data, error } = await supabase.from("developer_releases").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(input: DeveloperReleaseInsert): Promise<DeveloperReleaseRow> {
      const { data, error } = await supabase.from("developer_releases").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },

    async update(id: string, patch: DeveloperReleaseUpdate): Promise<void> {
      if (Object.keys(patch).length === 0) return;
      const { error } = await supabase.from("developer_releases").update(patch).eq("id", id);
      if (error) throw error;
    },

    async remove(id: string): Promise<void> {
      const { error } = await supabase.from("developer_releases").delete().eq("id", id);
      if (error) throw error;
    },

    async count(): Promise<number> {
      const { count, error } = await supabase.from("developer_releases").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  };
}

export type ReleaseRepository = ReturnType<typeof createReleaseRepository>;
