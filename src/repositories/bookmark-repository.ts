import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, BookmarkRow, BookmarkItemType } from "@/types/database";

/**
 * The fields a bookmark needs, in the same shape `src/lib/bookmarks.ts` /
 * `BookmarkButton` already work with (`BookmarkItem`) - kept independent of
 * that type name here so this file has no dependency on the store layer
 * above it. `type` defaults to `"article"` everywhere it's optional -
 * see migration 0015's doc comment: every bookmark before that migration
 * was implicitly an article, and every existing call site (article cards
 * across the app) still never sets it.
 */
export type BookmarkRecord = {
  type: BookmarkItemType;
  slug: string;
  title: string;
  description: string;
  image: string;
  category: string;
  source: string;
  publishedDate: string;
  meta: Record<string, string>;
};

function toRecord(row: BookmarkRow): BookmarkRecord {
  return {
    type: row.item_type,
    slug: row.article_slug,
    title: row.article_title,
    description: row.article_description,
    image: row.article_image,
    category: row.article_category,
    source: row.article_source,
    publishedDate: row.article_published_date,
    meta: row.item_meta,
  };
}

/**
 * Data access for the `bookmarks` table. See `profile-repository.ts` for
 * the reasoning on taking a `SupabaseClient` as a parameter instead of
 * importing one. Extended by migration 0015 to carry `item_type`/
 * `item_meta` alongside the original article-shaped columns, so a single
 * table can hold saved articles, Developer Releases, and repositories.
 */
export function createBookmarkRepository(supabase: SupabaseClient<Database>) {
  return {
    async list(userId: string): Promise<BookmarkRecord[]> {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toRecord);
    },

    /** Upsert so re-saving an already-bookmarked item is a harmless no-op, not a unique-constraint error. */
    async add(userId: string, item: BookmarkRecord): Promise<void> {
      const { error } = await supabase.from("bookmarks").upsert(
        {
          user_id: userId,
          item_type: item.type,
          article_slug: item.slug,
          article_title: item.title,
          article_description: item.description,
          article_image: item.image,
          article_category: item.category,
          article_source: item.source,
          article_published_date: item.publishedDate,
          item_meta: item.meta,
        },
        { onConflict: "user_id,item_type,article_slug" }
      );
      if (error) throw error;
    },

    async remove(userId: string, slug: string, type: BookmarkItemType = "article"): Promise<void> {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("item_type", type)
        .eq("article_slug", slug);
      if (error) throw error;
    },

    async clear(userId: string): Promise<void> {
      const { error } = await supabase.from("bookmarks").delete().eq("user_id", userId);
      if (error) throw error;
    },

    /**
     * Total row count across every user - backs the Admin Dashboard's
     * "Total Bookmarks" stat card. `bookmarks_select_own` RLS means this
     * only returns a meaningful site-wide total when called with a
     * service-role client (see `lib/supabase/service-client.ts`); with a
     * request-scoped client it returns only the signed-in caller's own
     * bookmark count, same caveat as `ProfileRepository.count()`.
     */
    async count(): Promise<number> {
      const { count, error } = await supabase.from("bookmarks").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },

    /**
     * Bookmark count per user for a batch of user ids, one round trip -
     * Admin Users Management's "Bookmark sayısı" column
     * (`admin-user-service.ts`). Selects just the `user_id` column for
     * every matching row and counts occurrences in application code (no
     * SQL `GROUP BY` support in the shimmed query builder, the same
     * tradeoff documented throughout the admin services) - bounded by
     * one page of users (<=1000, see `admin-user-service.ts`), never
     * one query per user.
     */
    async getManyByUserIds(userIds: string[]): Promise<Map<string, number>> {
      if (userIds.length === 0) return new Map();
      const { data, error } = await supabase.from("bookmarks").select("user_id").in("user_id", userIds);
      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
      }
      return counts;
    },
  };
}

export type BookmarkRepository = ReturnType<typeof createBookmarkRepository>;
