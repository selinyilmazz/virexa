"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
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

const navItems: NavItem[] = [
  {
    label: "AI",
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
    label: "Programming",
    href: "/category/programming",
    activePrefix: "/category/programming",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5.5l-3 13" />
      </svg>
    ),
  },
  {
    label: "Cloud",
    href: "/cloud",
    activePrefix: "/cloud",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M7 18a4.5 4.5 0 0 1-.4-8.98A5.5 5.5 0 0 1 17.3 9.8 4 4 0 0 1 17 18H7Z" />
      </svg>
    ),
  },
  {
    label: "Security",
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
    label: "Open Source",
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
    label: "Developer Hub",
    href: "/developer-hub",
    // Deliberately does NOT match `/developer-hub/releases` (that has its
    // own, more specific nav item below) - `startsWith` would otherwise
    // highlight both items at once while on a Release Detail page.
    activePrefix: "/developer-hub",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H16a2 2 0 0 1 2 2v14.5a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 19.5v-15Z" />
        <path d="M9 8h5M9 11h5" />
      </svg>
    ),
  },
  {
    // Developer Releases has grown into a major feature on its own
    // (Release Detail pages, per-technology bookmarking/view tracking -
    // see `lib/release-bookmarks.ts`/`lib/release-views.ts`), so it now
    // gets its own top-level nav item instead of living only inside
    // Developer Hub's catalog.
    label: "Developer Releases",
    href: "/developer-hub/releases",
    activePrefix: "/developer-hub/releases",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3v10M12 13l4-4M12 13 8 9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

/**
 * Category navigation row, a separate horizontal bar under the header's
 * search row (homepage redesign - matches the reference layout's split
 * of "search row" vs "category row" into two distinct rows instead of
 * one crowded header line). Client component only for `usePathname`
 * (active-category highlight) - everything else here is static.
 *
 * Alignment fix: this row is CENTERED (`justify-center` from `sm:` up),
 * not left-aligned under the logo - a left-aligned row that stops well
 * before the right edge is what was reading as "an old-generation news
 * site" rather than the Apple/Vercel/Linear/Arc pattern this is meant to
 * match, where a secondary nav row is centered as its own independent
 * element within the page's content width, unrelated to where the logo
 * above it happens to sit. Stays `justify-start` (scrolls from the left)
 * below `sm:` specifically because a centered row that overflows a
 * horizontally-scrolling mobile container starts scrolled to a
 * confusing mid-point instead of showing the first item.
 *
 * `gap-2 sm:gap-3 lg:gap-5` (was a flat `gap-1`) is the "don't compress
 * them together - they should breathe" fix - real space between pills,
 * not just each pill's own internal padding.
 *
 * Unified-Explorer design: AI/Programming/Security route to
 * `/category/[slug]` (a real DB category, pre-checked in the Filters
 * sidebar), Cloud routes to `/cloud` (no real "Cloud" category exists, so
 * it locks a search query instead), and Open Source routes to
 * `/open-source` (a real heuristic Content Type value, pre-selected in
 * Filters) - all three render the shared `ExplorerView` template.
 * "Resources" was renamed to "Developer Hub" (Developer Hub redesign) and
 * now routes to `/developer-hub` - a different template entirely
 * (`CatalogExplorerView`'s landing/dashboard page), since certifications,
 * courses, GitHub repos, tools, roadmaps and cheat sheets aren't articles
 * and can't be filtered through the News Explorer. Every item is
 * highlightable via `activePrefix`.
 */
export function CategoryNav() {
  const pathname = usePathname();

  // Picks the LONGEST matching `activePrefix` rather than checking each
  // item independently - "Developer Hub" (`/developer-hub`) and
  // "Developer Releases" (`/developer-hub/releases`) would otherwise both
  // highlight at once on a Release Detail page, since the former's prefix
  // is a `startsWith` match of the latter's URLs too.
  const activeLabel = navItems.reduce<string | null>((best, item) => {
    if (!item.activePrefix || !pathname.startsWith(item.activePrefix)) return best;
    const bestPrefix = best ? (navItems.find((candidate) => candidate.label === best)?.activePrefix ?? "") : "";
    return item.activePrefix.length > bestPrefix.length ? item.label : best;
  }, null);

  return (
    <nav aria-label="Category navigation" className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-12 max-w-[1820px] items-center justify-start gap-2 overflow-x-auto px-5 sm:justify-center sm:gap-3 sm:px-8 lg:gap-5">
        {navItems.map((item) => {
          const isActive = item.label === activeLabel;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-[#2f67e8] dark:bg-blue-950/40 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
