import type { User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createProfileRepository } from "@/repositories/profile-repository";
import { createBookmarkRepository } from "@/repositories/bookmark-repository";
import { isAdminUser } from "@/lib/admin/is-admin";

/**
 * Server-only read/lookup access for `/admin/users` (requirement 1).
 * Unlike every other admin service in this app, this one MUST use the
 * service-role client for its reads, not the request-scoped one: email,
 * role (`app_metadata`), email-verification, and last-sign-in all live
 * on `auth.users`, which is only reachable via the Supabase Admin API
 * (`supabase.auth.admin.*`) - there is no `profiles`/`bookmarks`-style
 * table a request-scoped client could read across every user anyway
 * (both are per-user RLS - see `0001_production_schema.sql`). This
 * mirrors `admin-dashboard-service.ts`'s existing use of the service
 * client for site-wide `profiles`/`bookmarks` counts, just extended to
 * the per-row detail this page needs.
 *
 * IMPORTANT, documented scale limitation: `supabase.auth.admin.listUsers()`
 * has no server-side search, so this service fetches one bounded page
 * (`MAX_USERS_FETCH` users, newest account activity first) and performs
 * search/filter/sort/pagination in application code - the same "bounded
 * candidate pool" tradeoff used throughout this app's admin services
 * (e.g. `admin-source-service.ts`'s per-source counts), just applied to
 * `auth.users` instead of a Postgres table. If the real user count ever
 * exceeds `MAX_USERS_FETCH`, `AdminUsersPage.truncated` is `true` and the
 * page surfaces that honestly rather than silently hiding users - see
 * the closing report's "Bilinen eksikler" for the real fix (server-side
 * search via a proper `profiles`-driven query once one exists).
 *
 * "Okunan makale sayısı" (requirement 1) has NO backing infrastructure
 * today: `article_metrics` tracks aggregate per-ARTICLE view counts, not
 * per-user reads, and there is no `article_reads`/`user_activity` table.
 * `articlesReadCount` is therefore always `null` ("mevcut altyapı izin
 * verdiği kadar" - the honest answer this phase is "not available yet"),
 * surfaced as "—" in the UI rather than a fabricated number.
 */

const MAX_USERS_FETCH = 1000;

export type AdminUserRole = "admin" | "user";

export type AdminUserListItem = {
  id: string;
  email: string;
  displayName: string;
  role: AdminUserRole;
  emailVerified: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  bookmarkCount: number;
  /** Always `null` - see this file's top doc comment. */
  articlesReadCount: number | null;
  suspended: boolean;
};

export type AdminUserFilters = {
  search?: string;
  role?: AdminUserRole;
  emailVerified?: boolean;
  suspended?: boolean;
};

export type AdminUsersPage = {
  items: AdminUserListItem[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  truncated: boolean;
};

function emptyUsersPage(page: number, pageSize: number): AdminUsersPage {
  return { items: [], total: 0, totalPages: 1, page, pageSize, truncated: false };
}

function isSuspended(user: User): boolean {
  return Boolean(user.banned_until) && new Date(user.banned_until as string).getTime() > Date.now();
}

function resolveDisplayName(user: User, profile: { full_name: string; username: string } | undefined): string {
  return profile?.full_name || profile?.username || user.email || user.id;
}

/**
 * Paginated, filterable, searchable user list (requirement 1). One
 * `auth.admin.listUsers()` call plus two parallel bulk lookups
 * (`profiles.getByIds`, `bookmarks.getManyByUserIds`) for exactly that
 * page's user ids - never one query per user (requirement 9).
 */
export async function getAdminUsersPage(
  filters: AdminUserFilters,
  page: number,
  pageSize: number
): Promise<AdminUsersPage> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return emptyUsersPage(page, pageSize);

    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: MAX_USERS_FETCH });
    if (error) throw error;

    const authUsers = data.users;
    const truncated = data.total > authUsers.length;
    const userIds = authUsers.map((user) => user.id);

    const [profiles, bookmarkCounts] = await Promise.all([
      createProfileRepository(supabase).getByIds(userIds),
      createBookmarkRepository(supabase).getManyByUserIds(userIds),
    ]);
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

    let items: AdminUserListItem[] = authUsers.map((user) => ({
      id: user.id,
      email: user.email ?? "",
      displayName: resolveDisplayName(user, profileById.get(user.id)),
      role: isAdminUser(user) ? "admin" : "user",
      emailVerified: Boolean(user.email_confirmed_at),
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      bookmarkCount: bookmarkCounts.get(user.id) ?? 0,
      articlesReadCount: null,
      suspended: isSuspended(user),
    }));

    if (filters.search) {
      const term = filters.search.trim().toLowerCase();
      items = items.filter((item) => item.email.toLowerCase().includes(term) || item.displayName.toLowerCase().includes(term));
    }
    if (filters.role) items = items.filter((item) => item.role === filters.role);
    if (filters.emailVerified !== undefined) items = items.filter((item) => item.emailVerified === filters.emailVerified);
    if (filters.suspended !== undefined) items = items.filter((item) => item.suspended === filters.suspended);

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    return { items: pageItems, total, totalPages: Math.max(1, Math.ceil(total / pageSize)), page, pageSize, truncated };
  } catch (error) {
    console.error("[admin-user-service] getAdminUsersPage failed:", error);
    return emptyUsersPage(page, pageSize);
  }
}
