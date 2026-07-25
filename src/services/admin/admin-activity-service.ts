import { getAdminArticlesPage } from "@/services/admin/admin-article-service";
import { getAdminUsersPage } from "@/services/admin/admin-user-service";
import { getAuditLogPage } from "@/services/admin/admin-audit-service";

/**
 * Dashboard "Recent Activity" feed (requirement 4) - merges THREE real
 * signals that already exist elsewhere in the app into one chronological
 * feed: recently published articles, recently registered users, and
 * admin audit events (source/user/runtime changes, etc.) - covering the
 * "Article published / Source added / User registered" examples from
 * the spec using data that's all genuinely real, never fabricated.
 *
 * The audit branch below reuses `getAuditLogPage()`'s enrichment
 * (`actorDisplayName`, `description` - see `lib/admin/audit-log-format.ts`)
 * so this feed's wording for an event matches the dedicated `/admin/audit`
 * page's wording for the exact same row, rather than two independently
 * formatted summaries of the same data. This feed stays capped at
 * `FEED_LIMIT` merged items across all three sources - it's a live "what
 * just happened" glance, not the full history; `/admin/audit` is the
 * real, searchable, fully paginated destination for that (a standalone
 * page again as of the Audit Log restoration - see `admin-nav-items.tsx`'s
 * doc comment for why).
 */

export type AdminActivityKind = "article" | "user" | "audit";

export type AdminActivityItem = {
  id: string;
  kind: AdminActivityKind;
  title: string;
  description: string;
  timestamp: string;
  href: string;
};

const FEED_LIMIT = 10;
const PER_SOURCE_LIMIT = 8;

export async function getAdminRecentActivity(): Promise<AdminActivityItem[]> {
  try {
    const [articlesPage, usersPage, auditPage] = await Promise.all([
      getAdminArticlesPage({}, 1, PER_SOURCE_LIMIT),
      getAdminUsersPage({}, 1, PER_SOURCE_LIMIT),
      getAuditLogPage(1, PER_SOURCE_LIMIT),
    ]);

    const items: AdminActivityItem[] = [
      ...articlesPage.items.map((article) => ({
        id: `article-${article.id}`,
        kind: "article" as const,
        title: "Article published",
        description: `${article.title} · ${article.sourceName}`,
        timestamp: article.publishedDate,
        href: `/admin/articles?selected=${article.id}`,
      })),
      ...usersPage.items.map((user) => ({
        id: `user-${user.id}`,
        kind: "user" as const,
        title: "User registered",
        description: user.email,
        timestamp: user.createdAt,
        href: `/admin/users?q=${encodeURIComponent(user.email)}`,
      })),
      ...auditPage.items.map((entry) => ({
        id: `audit-${entry.id}`,
        kind: "audit" as const,
        title: entry.description,
        description: `by ${entry.actorDisplayName}`,
        timestamp: entry.created_at,
        href: "/admin/audit",
      })),
    ];

    // `article.timestamp` is `formatPublishedDate()`'s "Month Day, Year"
    // string (not raw ISO, unlike the user/audit timestamps) - still a
    // real, `Date`-parseable value, just day-granularity rather than to
    // the second, which is an acceptable tradeoff for a "recent activity"
    // feed sorted across three different sources.
    return items
      .filter((item) => Boolean(item.timestamp))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, FEED_LIMIT);
  } catch (error) {
    console.error("[admin-activity-service] getAdminRecentActivity failed:", error);
    return [];
  }
}
