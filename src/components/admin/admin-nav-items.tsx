import type { ReactNode } from "react";

/**
 * Single source of truth for the admin area's primary navigation - used
 * by BOTH the desktop `AdminSidebar` and the mobile `AdminMobileNav`
 * drawer, so the two never drift apart (a mobile-only "no such page"
 * link, or a desktop item missing from the mobile menu, would be exactly
 * the sync bug this file exists to avoid).
 *
 * Admin Panel Redesign: Health, AI, and Audit Log are intentionally NOT
 * separate destinations anymore - their information now lives on the
 * Dashboard (`/admin`) itself (System Health card, Recent Activity feed),
 * per the explicit instruction to consolidate rather than keep three
 * mostly-empty/read-only pages around. Repositories and Developer
 * Releases are new first-class sections (DB-backed Open Source repo and
 * release management).
 */

export type AdminNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export type AdminNavGroup = {
  /** `null` for the top-level, always-visible "Dashboard" entry - it isn't part of a collapsible section. */
  label: string | null;
  items: AdminNavItem[];
};

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  className: "size-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
} as const;

const DASHBOARD_ITEM: AdminNavItem = {
  href: "/admin",
  label: "Dashboard",
  icon: (
    <svg {...ICON_PROPS}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" />
    </svg>
  ),
};

const ARTICLES_ITEM: AdminNavItem = {
  href: "/admin/articles",
  label: "Articles",
  icon: (
    <svg {...ICON_PROPS}>
      <path d="M6 3.5h9L19 8v12.5H6z" strokeLinejoin="round" />
      <path d="M9 12h6M9 15.5h6M9 8.5h3" strokeLinecap="round" />
    </svg>
  ),
};

const SOURCES_ITEM: AdminNavItem = {
  href: "/admin/sources",
  label: "Sources",
  icon: (
    <svg {...ICON_PROPS}>
      <path d="M4 4.5c8 0 15.5 7.5 15.5 15.5" strokeLinecap="round" />
      <path d="M4 10.5c4.7 0 9 4.3 9 9" strokeLinecap="round" />
      <circle cx="5" cy="19" r="1.8" />
    </svg>
  ),
};

const REPOSITORIES_ITEM: AdminNavItem = {
  href: "/admin/repositories",
  label: "Repositories",
  icon: (
    <svg {...ICON_PROPS}>
      <path d="M4 3.5h16v8.5H4z" strokeLinejoin="round" />
      <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" strokeLinejoin="round" />
      <circle cx="8" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ),
};

const RELEASES_ITEM: AdminNavItem = {
  href: "/admin/releases",
  label: "Developer Releases",
  icon: (
    <svg {...ICON_PROPS}>
      <path d="M12 3v10M12 13l4-4M12 13 8 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const COLLECTIONS_ITEM: AdminNavItem = {
  href: "/admin/collections",
  label: "GitHub Collections",
  icon: (
    <svg {...ICON_PROPS}>
      <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h5l1.5 2h6.5A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-11Z" strokeLinejoin="round" />
    </svg>
  ),
};

const CATALOG_ITEM: AdminNavItem = {
  href: "/admin/catalog-items",
  label: "Developer Hub Catalog",
  icon: (
    <svg {...ICON_PROPS}>
      <path d="M12 3.5 4 7v10l8 3.5 8-3.5V7l-8-3.5Z" strokeLinejoin="round" />
      <path d="M4 7l8 3.5M12 10.5l8-3.5M12 10.5V21" strokeLinejoin="round" />
    </svg>
  ),
};

const USERS_ITEM: AdminNavItem = {
  href: "/admin/users",
  label: "Users",
  icon: (
    <svg {...ICON_PROPS}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" strokeLinecap="round" />
      <path d="M16 4.3a3.2 3.2 0 0 1 0 6.2M18.5 20c0-2.9-1.8-5.1-4.2-5.8" strokeLinecap="round" />
    </svg>
  ),
};

const ANALYTICS_ITEM: AdminNavItem = {
  href: "/admin/analytics",
  label: "Analytics",
  icon: (
    <svg {...ICON_PROPS}>
      <path d="M4 20V10M11 20V4M18 20v-7" strokeLinecap="round" />
    </svg>
  ),
};

const RUNTIME_ITEM: AdminNavItem = {
  href: "/admin/runtime",
  label: "Runtime",
  icon: (
    <svg {...ICON_PROPS}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2" strokeLinecap="round" />
    </svg>
  ),
};

const SETTINGS_ITEM: AdminNavItem = {
  href: "/admin/settings",
  label: "Settings",
  icon: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/**
 * Grouped nav structure (requirement 12: "Improve the admin sidebar.
 * Group related modules into collapsible sections"). `Dashboard` is the
 * one top-level, always-visible entry (`label: null`) - everything else
 * is bucketed the way the spec's example groups them (Content/Developer
 * Hub/Users/Operations/System), scaled down to the pages that actually
 * exist in this app: there's no standalone Categories or Roles page (role
 * is edited inline on `/admin/users`), and Activity Log was deliberately
 * folded into the Dashboard's Recent Activity feed (see the comment
 * above), not resurrected here as a dead link.
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  { label: null, items: [DASHBOARD_ITEM] },
  { label: "Content", items: [ARTICLES_ITEM, SOURCES_ITEM] },
  { label: "Developer Hub", items: [REPOSITORIES_ITEM, COLLECTIONS_ITEM, RELEASES_ITEM, CATALOG_ITEM] },
  { label: "Users", items: [USERS_ITEM] },
  { label: "Operations", items: [ANALYTICS_ITEM, RUNTIME_ITEM] },
  { label: "System", items: [SETTINGS_ITEM] },
];

/** Flat list derived from `ADMIN_NAV_GROUPS` - kept for any caller that just needs "every admin destination" without the grouping (e.g. active-path checks). */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

export function isActiveAdminPath(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}
