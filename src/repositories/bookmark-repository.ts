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
    slug: row.item_slug,
    title: row.item_title,
    description: row.item_description,
    image: row.item_image,
    category: row.item_category,
    source: row.item_source,
    publishedDate: row.item_published_date,
    meta: row.item_meta,
  };
}

/**
 * Data access for the `bookmarks` table. See `profile-repository.ts` for
 * the reasoning on taking a `SupabaseClient` as a parameter instead of
 * importing one. Migration 0029 upgraded the live table (confirmed still
 * its original 0001 article-only shape - no `item_type` column existed in
 * production) to a real generic `item_*` model, so a single table can
 * hold saved articles, GitHub repositories, courses, certifications, and
 * Developer Releases without overloading article-shaped column names.
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
          item_slug: item.slug,
          item_title: item.title,
          item_description: item.description,
          item_image: item.image,
          item_category: item.category,
          item_source: item.source,
          item_published_date: item.publishedDate,
          item_meta: item.meta,
        },
        { onConflict: "user_id,item_type,item_slug" }
      );
      if (error) throw error;
    },

    async remove(userId: string, slug: string, type: BookmarkItemType = "article"): Promise<void> {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("item_type", type)
        .eq("item_slug", slug);
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

    /**
     * Bookmark count per item (across all users) for a batch of
     * `item_slug`s of a given `item_type` - GitHub Explorer's "Most
     * Bookmarked" sort/widget needs a real save count per repository, not
     * a per-user one. Same "select the narrow column, count in
     * application code" tradeoff as `getManyByUserIds` above (no `GROUP
     * BY` in the shimmed query builder) - bounded by one page of repo ids
     * at a time by the caller, never the whole table.
     */
    async getCountsByItemType(itemType: BookmarkItemType, slugs: string[]): Promise<Map<string, number>> {
      if (slugs.length === 0) return new Map();
      const { data, error } = await supabase
        .from("bookmarks")
        .select("item_slug")
        .eq("item_type", itemType)
        .in("item_slug", slugs);
      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        counts.set(row.item_slug, (counts.get(row.item_slug) ?? 0) + 1);
      }
      return counts;
    },
  };
}

export type BookmarkRepository = ReturnType<typeof createBookmarkRepository>;
