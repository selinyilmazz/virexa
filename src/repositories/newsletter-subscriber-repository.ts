import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, NewsletterSubscriberRow } from "@/types/database";

/** Trim + lowercase - the one normalization every read/write against `newsletter_subscribers.email` goes through, so the table's plain UNIQUE constraint stays effectively case-insensitive (see the migration's column comment). Exported so callers (the service layer) can normalize before calling `findByEmail`/`subscribe` without duplicating this logic. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Repository for `newsletter_subscribers` (migration 0033) - same
 * factory-function-over-a-request-scoped-client shape as
 * `source-repository.ts`. Fetches the whole table for `list()` (small,
 * bounded data set, same deliberate tradeoff `source-repository.ts`
 * documents - filtering/sorting/pagination happen in the service layer via
 * `paginateArray`), and every write always goes through the service-role
 * client (see the callers in `newsletter-service.ts` and
 * `/api/admin/newsletter/*` - RLS grants no direct anon/authenticated
 * access at all).
 */
export function createNewsletterSubscriberRepository(supabase: SupabaseClient<Database>) {
  return {
    async findByEmail(email: string): Promise<NewsletterSubscriberRow | null> {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .eq("email", normalizeEmail(email))
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async getById(id: string): Promise<NewsletterSubscriberRow | null> {
      const { data, error } = await supabase.from("newsletter_subscribers").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    /** Newest-first - matches every other admin listing's default sort (`AdminSourceFilters`-style pages, `getAdminSourcesList`). */
    async list(): Promise<NewsletterSubscriberRow[]> {
      const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async count(): Promise<number> {
      const { count, error } = await supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },

    async countActive(): Promise<number> {
      const { count, error } = await supabase
        .from("newsletter_subscribers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      if (error) throw error;
      return count ?? 0;
    },

    /** Inserts a new subscriber. Caller (`newsletter-service.ts`) is responsible for checking `findByEmail()` first - kept as two steps rather than an upsert so "already subscribed" can be distinguished from a genuine new signup at the service layer. */
    async subscribe(email: string): Promise<NewsletterSubscriberRow> {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: normalizeEmail(email) })
        .select("*")
        .single();
      if (error) throw error;
      if (!data) throw new Error("Insert returned no row.");
      return data;
    },

    async updateFields(id: string, patch: { is_active: boolean }): Promise<void> {
      const { error } = await supabase.from("newsletter_subscribers").update(patch).eq("id", id);
      if (error) throw error;
    },

    async remove(id: string): Promise<void> {
      const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
      if (error) throw error;
    },
  };
}

export type NewsletterSubscriberRepository = ReturnType<typeof createNewsletterSubscriberRepository>;
