import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogItemInsert, CatalogItemRow, CatalogItemUpdate, CatalogResourceTypeDb, Database } from "@/types/database";

/** Data access for the `catalog_items` table (supabase/migrations/0022_catalog_items.sql) - Admin Panel: Developer Hub Catalog management. */
export function createCatalogItemRepository(supabase: SupabaseClient<Database>) {
  return {
    async list(opts?: { visibleOnly?: boolean; resourceType?: CatalogResourceTypeDb }): Promise<CatalogItemRow[]> {
      let query = supabase.from("catalog_items").select("*");
      if (opts?.visibleOnly) query = query.eq("visible", true);
      if (opts?.resourceType) query = query.eq("resource_type", opts.resourceType);
      const { data, error } = await query.order("resource_type", { ascending: true }).order("display_order", { ascending: true }).order("title", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },

    async getById(id: string): Promise<CatalogItemRow | null> {
      const { data, error } = await supabase.from("catalog_items").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(input: CatalogItemInsert): Promise<CatalogItemRow> {
      const { data, error } = await supabase.from("catalog_items").insert(input).select("*").single();
      if (error) throw error;
      if (!data) throw new Error("Insert into catalog_items returned no row.");
      return data;
    },

    async update(id: string, patch: CatalogItemUpdate): Promise<void> {
      if (Object.keys(patch).length === 0) return;
      const { error } = await supabase.from("catalog_items").update(patch).eq("id", id);
      if (error) throw error;
    },

    async remove(id: string): Promise<void> {
      const { error } = await supabase.from("catalog_items").delete().eq("id", id);
      if (error) throw error;
    },

    async count(): Promise<number> {
      const { count, error } = await supabase.from("catalog_items").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  };
}

export type CatalogItemRepository = ReturnType<typeof createCatalogItemRepository>;
