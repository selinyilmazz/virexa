import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createNewsletterSubscriberRepository } from "@/repositories/newsletter-subscriber-repository";
import { paginateArray, type PagedArrayResult } from "@/lib/admin/paginate-array";
import type { NewsletterSubscriberRow } from "@/types/database";

/**
 * Admin read layer for `/admin/newsletter`. Unlike `admin-source-service.ts`
 * (which reads through the request-scoped, RLS-respecting `createClient()`,
 * since `article_sources` is publicly readable), this always uses the
 * service-role client - `newsletter_subscribers` has zero RLS policies at
 * all (see migration 0033's doc comment), the same reasoning
 * `admin-audit-service.ts` documents for `admin_audit_log`. Subscriber
 * emails are the whole point of this table and are never meant to be
 * client-readable, even for a signed-in admin's own session.
 *
 * "Never throws" convention: every exported function catches its own
 * errors, logs them, and returns a safe empty fallback - a Supabase outage
 * here should degrade `/admin/newsletter` to an empty state, not crash the
 * page.
 */

const getRepository = cache(() => {
  const supabase = createServiceClient();
  return supabase ? createNewsletterSubscriberRepository(supabase) : null;
});

/** Newest-first (repository default) - the full, unfiltered list this service's other functions all derive from, same "small, bounded table, filter/sort/paginate in memory" tradeoff `source-repository.ts` documents. */
export async function getAdminNewsletterSubscribersList(): Promise<NewsletterSubscriberRow[]> {
  try {
    const repository = getRepository();
    if (!repository) return [];
    return await repository.list();
  } catch (error) {
    console.error("[admin-newsletter-service] getAdminNewsletterSubscribersList failed:", error);
    return [];
  }
}

export async function getAdminNewsletterSubscriberById(id: string): Promise<NewsletterSubscriberRow | null> {
  try {
    const repository = getRepository();
    if (!repository) return null;
    return await repository.getById(id);
  } catch (error) {
    console.error("[admin-newsletter-service] getAdminNewsletterSubscriberById failed:", error);
    return null;
  }
}

export type AdminNewsletterSortOrder = "newest" | "oldest";

export async function getAdminNewsletterSubscribersPage(
  search: string | undefined,
  sort: AdminNewsletterSortOrder,
  page: number,
  pageSize: number
): Promise<PagedArrayResult<NewsletterSubscriberRow>> {
  const all = await getAdminNewsletterSubscribersList();

  const needle = search?.trim().toLowerCase();
  const filtered = needle ? all.filter((row) => row.email.toLowerCase().includes(needle)) : all;

  // `list()` is already newest-first; "oldest" just reverses that.
  const sorted = sort === "oldest" ? [...filtered].reverse() : filtered;

  return paginateArray(sorted, page, pageSize);
}

export type AdminNewsletterStats = {
  total: number;
  active: number;
  inactive: number;
  /** Real count of subscribers whose `created_at` falls in the last 7 days - the "Newest subscribers" stat card. Never fabricated. */
  newLast7Days: number;
  /** Most recent signups (newest-first), for a short "Newest subscribers" preview list below the stat cards. */
  newest: NewsletterSubscriberRow[];
};

const NEWEST_SAMPLE_SIZE = 5;
const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function getAdminNewsletterStats(): Promise<AdminNewsletterStats> {
  try {
    const all = await getAdminNewsletterSubscribersList();
    const active = all.filter((row) => row.is_active).length;
    const cutoff = Date.now() - NEW_WINDOW_MS;
    const newLast7Days = all.filter((row) => new Date(row.created_at).getTime() >= cutoff).length;
    return { total: all.length, active, inactive: all.length - active, newLast7Days, newest: all.slice(0, NEWEST_SAMPLE_SIZE) };
  } catch (error) {
    console.error("[admin-newsletter-service] getAdminNewsletterStats failed:", error);
    return { total: 0, active: 0, inactive: 0, newLast7Days: 0, newest: [] };
  }
}
