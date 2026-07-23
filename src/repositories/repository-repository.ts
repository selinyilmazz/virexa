import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  RepositoryCategory,
  RepositoryDifficulty,
  RepositoryInsert,
  RepositoryRow,
  RepositoryUpdate,
} from "@/types/database";

export type RepositoryListParams = {
  visibleOnly?: boolean;
  /** Free-text match across owner/repo_name/description (case-insensitive). */
  search?: string;
  language?: string;
  status?: "active" | "hidden" | "archived";
  sort?: "stars" | "forks" | "watchers" | "name" | "last_synced_at" | "recommendation_score" | "health_score" | "display_order";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  // --- Editorial filters added for the GitHub Explorer "Developer
  // Knowledge Library" redesign (0024) - Admin Repositories management's
  // expanded filter set, matching the columns added by that migration.
  category?: RepositoryCategory;
  difficulty?: RepositoryDifficulty;
  editorPick?: boolean;
  hiddenGem?: boolean;
  verified?: boolean;
  maintained?: boolean;
  trending?: boolean;
  /** Repos carrying ALL of these editorial tags (array containment, not "any of") - same convention as `article-repository.ts`'s `tag` filter. */
  tags?: string[];
};

export type RepositoryListPage = {
  items: RepositoryRow[];
  total: number;
};

const SORT_COLUMN: Record<NonNullable<RepositoryListParams["sort"]>, string> = {
  stars: "stars",
  forks: "forks",
  watchers: "watchers",
  name: "repo_name",
  last_synced_at: "last_synced_at",
  recommendation_score: "recommendation_score",
  health_score: "health_score",
  display_order: "display_order",
};

/** Data access for the `repositories` table (supabase/migrations/0018_repositories.sql, extended by 0023) - Admin Panel: Repositories management. */
export function createRepositoryRepository(supabase: SupabaseClient<Database>) {
  return {
    async list(opts?: { visibleOnly?: boolean }): Promise<RepositoryRow[]> {
      let query = supabase.from("repositories").select("*");
      if (opts?.visibleOnly) query = query.eq("visible", true);
      const { data, error } = await query.order("stars", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    /**
     * Filtered/sorted/paginated list for `/admin/repositories` (search,
     * language + status filters, sort, page/pageSize) - the admin-only
     * counterpart to `list()` above, which the public Open Source
     * Explorer and `syncAllRepositories()` still use unchanged.
     */
    async listPage(params: RepositoryListParams): Promise<RepositoryListPage> {
      let query = supabase.from("repositories").select("*", { count: "exact" });

      if (params.visibleOnly) query = query.eq("visible", true);
      if (params.language) query = query.eq("language", params.language);
      if (params.status === "archived") query = query.eq("archived", true);
      if (params.status === "hidden") query = query.eq("archived", false).eq("visible", false);
      if (params.status === "active") query = query.eq("archived", false).eq("visible", true);
      if (params.search) {
        const needle = params.search.trim();
        if (needle)
          query = query.or(
            `owner.ilike.%${needle}%,repo_name.ilike.%${needle}%,description.ilike.%${needle}%,editor_notes.ilike.%${needle}%`
          );
      }
      if (params.category) query = query.eq("category", params.category);
      if (params.difficulty) query = query.eq("difficulty", params.difficulty);
      if (params.editorPick !== undefined) query = query.eq("editor_pick", params.editorPick);
      if (params.hiddenGem !== undefined) query = query.eq("hidden_gem", params.hiddenGem);
      if (params.verified !== undefined) query = query.eq("verified", params.verified);
      if (params.maintained !== undefined) query = query.eq("maintained", params.maintained);
      if (params.trending !== undefined) query = query.eq("trending", params.trending);
      // `.contains()` (not a real `overlaps`/`&&` - the shimmed query
      // builder, `types/supabase-shims.d.ts`, doesn't expose one) - same
      // array-containment method `article-repository.ts` already uses for
      // its own `tag` filter, so a multi-tag filter here means "has ALL
      // of these tags" rather than "has ANY of these tags".
      if (params.tags && params.tags.length > 0) query = query.contains("tags", params.tags);

      const sortColumn = SORT_COLUMN[params.sort ?? "stars"];
      query = query.order(sortColumn, { ascending: params.sortDirection === "asc" });

      const pageSize = params.pageSize ?? 25;
      const page = Math.max(1, params.page ?? 1);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { items: data ?? [], total: count ?? 0 };
    },

    /**
     * Distinct, non-null languages currently in use - powers the Language
     * filter dropdown with only real, present values (never a fixed
     * hardcoded list). Filtered/deduped in application code rather than
     * via `.not()` (the shimmed query builder's typing here doesn't carry
     * that method) - same "no server-side GROUP BY, reduce in app code"
     * tradeoff already used by `article-ai-repository.ts`'s
     * `listAllLatestPerArticle`, and cheap since this table is small.
     */
    async listDistinctLanguages(): Promise<string[]> {
      const { data, error } = await supabase.from("repositories").select("language");
      if (error) throw error;
      const languages = new Set((data ?? []).map((row) => row.language).filter((lang): lang is string => Boolean(lang)));
      return Array.from(languages).sort((a, b) => a.localeCompare(b));
    },

    async getById(id: string): Promise<RepositoryRow | null> {
      const { data, error } = await supabase.from("repositories").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(input: RepositoryInsert): Promise<RepositoryRow> {
      const { data, error } = await supabase.from("repositories").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },

    async update(id: string, patch: RepositoryUpdate): Promise<void> {
      if (Object.keys(patch).length === 0) return;
      const { error } = await supabase.from("repositories").update(patch).eq("id", id);
      if (error) throw error;
    },

    async remove(id: string): Promise<void> {
      const { error } = await supabase.from("repositories").delete().eq("id", id);
      if (error) throw error;
    },

    async count(): Promise<number> {
      const { count, error } = await supabase.from("repositories").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  };
}

export type RepositoryRepository = ReturnType<typeof createRepositoryRepository>;
