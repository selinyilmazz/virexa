import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CollectionInsert,
  CollectionRow,
  CollectionUpdate,
  Database,
  RepositoryRow,
} from "@/types/database";

export type CollectionWithCount = CollectionRow & { repositoryCount: number };

/**
 * Data access for `collections` + `collection_repositories`
 * (supabase/migrations/0024_repositories_editorial_and_collections.sql) -
 * admin-curated repository groupings for the GitHub Explorer "Featured
 * Collections" section, distinct from `repositories.category`'s fixed
 * 9-bucket taxonomy (see that migration's doc comment). Mirrors
 * `catalog-item-repository.ts`'s shape: a public-facing `listVisible`/
 * `getBySlug` pair (RLS-scoped, respects `visible`) plus full CRUD for
 * `/admin/collections`.
 */
export function createCollectionRepository(supabase: SupabaseClient<Database>) {
  return {
    /** Every collection, visible or not - Admin Collections management page. */
    async listAll(): Promise<CollectionRow[]> {
      const { data, error } = await supabase.from("collections").select("*").order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },

    /** `visible = true` only, ordered for display - the public GitHub Explorer "Featured Collections" section. RLS enforces the same filter even if this forgot to. */
    async listVisible(): Promise<CollectionRow[]> {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("visible", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },

    async getById(id: string): Promise<CollectionRow | null> {
      const { data, error } = await supabase.from("collections").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async getBySlug(slug: string): Promise<CollectionRow | null> {
      const { data, error } = await supabase.from("collections").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(input: CollectionInsert): Promise<CollectionRow> {
      const { data, error } = await supabase.from("collections").insert(input).select("*").single();
      if (error) throw error;
      if (!data) throw new Error("Insert into collections returned no row.");
      return data;
    },

    async update(id: string, patch: CollectionUpdate): Promise<void> {
      if (Object.keys(patch).length === 0) return;
      const { error } = await supabase.from("collections").update(patch).eq("id", id);
      if (error) throw error;
    },

    /** `on delete cascade` on `collection_repositories.collection_id` handles membership cleanup automatically. */
    async remove(id: string): Promise<void> {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },

    /**
     * Real membership count per collection, one round trip - powers the
     * Admin Collections list's "N repositories" column and the public
     * "Featured Collections" card counts. Counted in application code
     * (no `GROUP BY` in the shimmed query builder, same tradeoff as
     * `bookmark-repository.ts`'s `getManyByUserIds`).
     */
    async listAllWithCounts(): Promise<CollectionWithCount[]> {
      const [{ data: collections, error: collectionsError }, { data: memberships, error: membershipsError }] =
        await Promise.all([
          supabase.from("collections").select("*").order("display_order", { ascending: true }),
          supabase.from("collection_repositories").select("collection_id"),
        ]);
      if (collectionsError) throw collectionsError;
      if (membershipsError) throw membershipsError;

      const counts = new Map<string, number>();
      for (const row of memberships ?? []) {
        counts.set(row.collection_id, (counts.get(row.collection_id) ?? 0) + 1);
      }

      return (collections ?? []).map((collection) => ({
        ...collection,
        repositoryCount: counts.get(collection.id) ?? 0,
      }));
    },

    /**
     * Ordered repository rows for one collection's public listing - joins
     * membership order with the real `repositories` rows in application
     * code (two round trips, bounded by one collection's membership size,
     * never the whole catalog).
     */
    async listRepositoriesForCollection(collectionId: string): Promise<RepositoryRow[]> {
      const { data: memberships, error: membershipError } = await supabase
        .from("collection_repositories")
        .select("repository_id, display_order")
        .eq("collection_id", collectionId)
        .order("display_order", { ascending: true });
      if (membershipError) throw membershipError;
      if (!memberships || memberships.length === 0) return [];

      const repoIds = memberships.map((m) => m.repository_id);
      const { data: repos, error: reposError } = await supabase.from("repositories").select("*").in("id", repoIds);
      if (reposError) throw reposError;

      const orderById = new Map(memberships.map((m) => [m.repository_id, m.display_order]));
      return (repos ?? [])
        .filter((repo) => repo.visible && !repo.archived)
        .sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0));
    },

    /** Every collection id a given repository belongs to - Admin Repositories edit form's "Collections" multi-select. */
    async listCollectionIdsForRepository(repositoryId: string): Promise<string[]> {
      const { data, error } = await supabase
        .from("collection_repositories")
        .select("collection_id")
        .eq("repository_id", repositoryId);
      if (error) throw error;
      return (data ?? []).map((row) => row.collection_id);
    },

    /**
     * Replaces a collection's full membership list in one call
     * (delete-then-insert, same "authoritative full-set replace" pattern
     * used for tag/topic multi-selects elsewhere in this codebase) -
     * simpler and safer for an admin form's "Save" button than computing
     * a diff of adds/removes.
     */
    async setMembers(collectionId: string, repositoryIds: string[]): Promise<void> {
      const { error: deleteError } = await supabase
        .from("collection_repositories")
        .delete()
        .eq("collection_id", collectionId);
      if (deleteError) throw deleteError;

      if (repositoryIds.length === 0) return;

      const rows = repositoryIds.map((repositoryId, index) => ({
        collection_id: collectionId,
        repository_id: repositoryId,
        display_order: index,
      }));
      const { error: insertError } = await supabase.from("collection_repositories").insert(rows);
      if (insertError) throw insertError;
    },

    async addMember(collectionId: string, repositoryId: string, displayOrder = 0): Promise<void> {
      const { error } = await supabase
        .from("collection_repositories")
        .upsert(
          { collection_id: collectionId, repository_id: repositoryId, display_order: displayOrder },
          { onConflict: "collection_id,repository_id" }
        );
      if (error) throw error;
    },

    async removeMember(collectionId: string, repositoryId: string): Promise<void> {
      const { error } = await supabase
        .from("collection_repositories")
        .delete()
        .eq("collection_id", collectionId)
        .eq("repository_id", repositoryId);
      if (error) throw error;
    },
  };
}

export type CollectionRepository = ReturnType<typeof createCollectionRepository>;
