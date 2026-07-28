import type { ReactNode } from "react";

export type NavItem = {
  /** Translation key (not literal text) - reuses existing keys from other localized surfaces (`nav.categories.ai`, `explorer.pages.*.title`, `openSource.hero.title`, `developerHub.landing.breadcrumbCurrent`) rather than duplicating strings, since every one of these labels already exists as a real page heading elsewhere. */
  labelKey: string;
  href: string;
  icon: ReactNode;
  /** Pathname prefix this item is considered "active" for. Every item now has a dedicated page (see the unified-Explorer design), so every item is highlightable. */
  activePrefix?: string;
};

const ICON_PROPS = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  className: "size-5 shrink-0",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * The single source of truth for Virexa's primary content categories -
 * shared between the desktop `CategoryNav` row and the mobile hamburger
 * drawer (navbar redesign) so the two never drift out of sync. See
 * `CategoryNav.tsx` for the full history/rationale behind each item's
 * route (unified-Explorer design, Cloud/Open Source routing, etc.).
 */
export const primaryNavItems: NavItem[] = [
  {
    labelKey: "nav.categories.ai",
    href: "/category/ai",
    activePrefix: "/category/ai",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    labelKey: "explorer.pages.programmingCategory.title",
    href: "/category/programming",
    activePrefix: "/category/programming",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5.5l-3 13" />
      </svg>
    ),
  },
  {
    labelKey: "explorer.pages.cloud.title",
    href: "/cloud",
    activePrefix: "/cloud",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M7 18a4.5 4.5 0 0 1-.4-8.98A5.5 5.5 0 0 1 17.3 9.8 4 4 0 0 1 17 18H7Z" />
      </svg>
    ),
  },
  {
    labelKey: "explorer.pages.securityCategory.title",
    href: "/category/security",
    activePrefix: "/category/security",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3.5 5 6v5.5c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6l-7-2.5Z" />
        <path d="m9.2 12.2 1.9 1.9 3.7-3.9" />
      </svg>
    ),
  },
  {
    labelKey: "openSource.hero.title",
    href: "/open-source",
    activePrefix: "/open-source",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="6" cy="6" r="2.2" />
        <circle cx="6" cy="18" r="2.2" />
        <circle cx="18" cy="12" r="2.2" />
        <path d="M6 8.2v7.6M8 6.9l8 3.7M8 17.1l8-3.7" />
      </svg>
    ),
  },
  {
    // "Games" and "Mobile Games" are real DB categories (see
    // `SEARCH_CATEGORY_SLUGS`) routed through `/category/[slug]`'s
    // `EXPLORER_CATEGORIES` map - same unified-Explorer treatment as
    // AI/Programming/Security, not the legacy `CategoryHeader` template.
    labelKey: "explorer.pages.gamesCategory.title",
    href: "/category/games",
    activePrefix: "/category/games",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="7.5" width="18" height="10" rx="4" />
        <path d="M7.5 10.5v4M5.5 12.5h4" strokeLinecap="round" />
        <circle cx="15" cy="11" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="17.5" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    labelKey: "explorer.pages.mobileGamesCategory.title",
    href: "/category/mobile-games",
    activePrefix: "/category/mobile-games",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="7" y="2.5" width="10" height="19" rx="2" />
        <circle cx="12" cy="18" r="0.9" fill="currentColor" stroke="none" />
        <path d="M9.5 8.5h5M9.5 11h3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    labelKey: "developerHub.landing.breadcrumbCurrent",
    href: "/developer-hub",
    activePrefix: "/developer-hub",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H16a2 2 0 0 1 2 2v14.5a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 19.5v-15Z" />
        <path d="M9 8h5M9 11h5" />
      </svg>
    ),
  },
];
