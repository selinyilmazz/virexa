"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavItems as navItems } from "@/lib/layout/primary-nav-items";

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
 * Unified-Explorer design: AI/Programming/Security/Games/Mobile Games
 * route to `/category/[slug]` (a real DB category, pre-checked in the
 * Filters sidebar), Cloud routes to `/cloud` (no real "Cloud" category
 * exists, so it locks a search query instead), and Open Source routes to
 * `/open-source` (a real heuristic Content Type value, pre-selected in
 * Filters) - all five render the shared `ExplorerView` template.
 * "Resources" was renamed to "Developer Hub" (Developer Hub redesign) and
 * now routes to `/developer-hub` - a different template entirely
 * (`CatalogExplorerView`'s landing/dashboard page), since certifications,
 * courses, GitHub repos, tools, roadmaps and cheat sheets aren't articles
 * and can't be filtered through the News Explorer. Every item is
 * highlightable via `activePrefix`.
 *
 * Stabilization pass: "Developer Releases" was removed from this row
 * entirely - it's reachable from the homepage `DeveloperReleases` widget's
 * "View All" link (`/developer-hub/releases`) instead, keeping this row
 * focused on content categories rather than a mix of categories and
 * feature areas.
 */
export function CategoryNav() {
  const pathname = usePathname();

  // Picks the LONGEST matching `activePrefix` rather than checking each
  // item independently - useful if any future item's prefix is itself a
  // `startsWith` match of another item's URLs (e.g. a nested route).
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
