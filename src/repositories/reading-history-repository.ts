import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ReadingHistoryRow } from "@/types/database";

/** The article fields a history row needs - same denormalized-field convention `BookmarkRecord` (`bookmark-repository.ts`) already uses. */
export type ReadingHistoryRecord = {
  articleId: string;
  slug: string;
  title: string;
  image: string;
  category: string;
  source: string;
  readAt: string;
};

function toRecord(row: ReadingHistoryRow): ReadingHistoryRecord {
  return {
    articleId: row.article_id,
    slug: row.article_slug,
    title: row.article_title,
    image: row.article_image,
    category: row.article_category,
    source: row.article_source,
    readAt: row.read_at,
  };
}

/**
 * Data access for the `reading_history` table (product polishing phase,
 * 2nd pass - `supabase/migrations/0011_reading_history.sql`). Reads use
 * RLS's `reading_history_select_own` policy so any client works for
 * `list`/`count`; `recordRead` is only ever called with the service-role
 * client (see `article-metrics-service.ts`'s `recordArticleRead`) since
 * there is no `insert` RLS policy for the `authenticated` role.
 */
export function createReadingHistoryRepository(supabase: SupabaseClient<Database>) {
  return {
    async list(userId: string, limit = 20): Promise<ReadingHistoryRecord[]> {
      const { data, error } = await supabase
        .from("reading_history")
        .select("*")
        .eq("user_id", userId)
        .order("read_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(toRecord);
    },

    /** Total distinct articles read by this user - backs the Profile summary header's "Read Articles" stat. */
    async count(userId: string): Promise<number> {
      const { count, error } = await supabase
        .from("reading_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) throw error;
      return count ?? 0;
    },

    /**
     * Upsert on (user_id, article_id): opening the same article again
     * bumps `read_at` to now (and refreshes the denormalized fields, in
     * case the title/image changed since the last read) instead of
     * erroring on the unique constraint or creating a duplicate row.
     */
    async recordRead(userId: string, item: Omit<ReadingHistoryRecord, "readAt">): Promise<void> {
      const { error } = await supabase.from("reading_history").upsert(
        {
          user_id: userId,
          article_id: item.articleId,
          article_slug: item.slug,
          article_title: item.title,
          article_image: item.image,
          article_category: item.category,
          article_source: item.source,
          read_at: new Date().toISOString(),
        },
        { onConflict: "user_id,article_id" }
      );
      if (error) throw error;
    },
  };
}

export type ReadingHistoryRepository = ReturnType<typeof createReadingHistoryRepository>;
