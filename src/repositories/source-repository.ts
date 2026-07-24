import type { SupabaseClient } from "@supabase/supabase-js";
import { articleSourceInputSchema } from "@/lib/validation/article-storage-schema";
import type { ArticleSourceInput } from "@/lib/validation/article-storage-schema";
import type { ArticleSourceInsert, ArticleSourceRow, ArticleSourceUpdate, Database } from "@/types/database";

function toInsert(input: ArticleSourceInput): ArticleSourceInsert {
  return {
    id: input.id,
    name: input.name,
    domain: input.domain,
    logo: input.logo ?? null,
    official: input.official,
    country: input.country,
    trust_score: input.trustScore,
    active: input.active,
  };
}

/**
 * Data access for the `article_sources` table. `id` is the same stable
 * string key already used by the news engine's `SOURCES` registry (see
 * `src/lib/news/sources.ts`), so persisting a source is always a
 * natural-key upsert - never a lookup-then-decide.
 */
export function createSourceRepository(supabase: SupabaseClient<Database>) {
  return {
    async getById(id: string): Promise<ArticleSourceRow | null> {
      const { data, error } = await supabase.from("article_sources").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async list(): Promise<ArticleSourceRow[]> {
      const { data, error } = await supabase.from("article_sources").select("*").order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },

    /** Bulk upsert - one round trip for the whole batch ("Toplu insert kullan"). Every input is validated before the network call, so a malformed source never reaches the database. */
    async bulkUpsert(inputs: ArticleSourceInput[]): Promise<void> {
      if (inputs.length === 0) return;
      const rows = inputs.map((input) => toInsert(articleSourceInputSchema.parse(input)));
      const { error } = await supabase.from("article_sources").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    },

    /** Total row count - a zero-row `head` request. Backs the Admin Dashboard's "Total Sources" stat card. */
    async count(): Promise<number> {
      const { count, error } = await supabase.from("article_sources").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },

    /** Count of sources with `active = true` - Admin Analytics' "Active Sources" summary card (requirement 1). Same zero-row `head` request as `count()`, just filtered. */
    async countActive(): Promise<number> {
      const { count, error } = await supabase
        .from("article_sources")
        .select("*", { count: "exact", head: true })
        .eq("active", true);
      if (error) throw error;
      return count ?? 0;
    },

    /**
     * Lightweight, columns-only update - Admin Source Actions'
     * "Aktif/Pasif" toggle and "Trust Score güncelleme" (requirement 6).
     * Deliberately narrower than `bulkUpsert` (which requires every
     * NOT NULL column and is meant for the news pipeline's natural-key
     * upserts): this only ever touches the field(s) actually passed in,
     * so an admin toggling `active` can never accidentally clobber the
     * source's name/domain/logo. No delete support here by design
     * ("Silme yapılmayacak").
     */
    async updateFields(id: string, patch: { active?: boolean; trustScore?: number }): Promise<void> {
      const update: ArticleSourceUpdate = {};
      if (patch.active !== undefined) update.active = patch.active;
      if (patch.trustScore !== undefined) update.trust_score = patch.trustScore;
      if (Object.keys(update).length === 0) return;

      const { error } = await supabase.from("article_sources").update(update).eq("id", id);
      if (error) throw error;
    },

    /**
     * Full create for the Admin Sources CMS ("Create/Edit/Delete" -
     * supersedes the earlier "Silme yapılmayacak" design note above,
     * which predates the current Admin Panel spec that explicitly asks
     * for source deletion). Validates through the same
     * `articleSourceInputSchema` the news pipeline's `bulkUpsert` uses,
     * then a plain `insert` (not `upsert`) so creating a source with an
     * id that already exists fails loudly instead of silently
     * overwriting an existing row.
     */
    async create(input: ArticleSourceInput): Promise<ArticleSourceRow> {
      const parsed = articleSourceInputSchema.parse(input);
      const { data, error } = await supabase.from("article_sources").insert(toInsert(parsed)).select("*").single();
      if (error) throw error;
      if (!data) throw new Error("Insert into article_sources returned no row.");
      return data;
    },

    /**
     * Full-record edit for the Admin Sources CMS - unlike `updateFields`
     * (deliberately narrow, toggle-only), this lets an admin correct
     * name/domain/logo/official/country in addition to active/trustScore.
     */
    async updateAll(id: string, patch: Partial<Omit<ArticleSourceRow, "id" | "created_at" | "updated_at">>): Promise<void> {
      if (Object.keys(patch).length === 0) return;
      const { error } = await supabase.from("article_sources").update(patch).eq("id", id);
      if (error) throw error;
    },

    /**
     * Deletes a source row. `articles.source_id` has `on delete cascade`
     * (see `supabase/migrations/0002_article_storage.sql`), so this also
     * deletes every article ever ingested from this source - callers
     * (the admin API route) must surface that clearly before confirming.
     */
    async remove(id: string): Promise<void> {
      const { error } = await supabase.from("article_sources").delete().eq("id", id);
      if (error) throw error;
    },
  };
}

export type SourceRepository = ReturnType<typeof createSourceRepository>;
