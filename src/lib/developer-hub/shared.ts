/**
 * Mirrors `src/lib/news-explorer/shared.ts` for the Developer Hub catalog
 * domain. Deliberately a plain, dependency-free module (no Supabase, no
 * `next/headers`, nothing server-only) - this is the ONE place that both
 * server code (`developer-hub-service.ts`, which imports the
 * `next/headers`-dependent `article-read-service.ts`) and Client
 * Components (`CatalogFiltersPanel.tsx`, which needs `RESOURCE_TYPE_LABELS`
 * to render its Type checkboxes) can both safely import from.
 *
 * Architecture note: `CatalogResourceType`/`RESOURCE_TYPE_LABELS` used to
 * live in `developer-hub-service.ts` itself. That file transitively
 * imports `@/lib/supabase/server` (via `getNewsExplorerArticles`), so a
 * Client Component importing anything from it - even a plain constant -
 * pulled that whole server-only module graph into the client bundle and
 * crashed with "You're importing a module that depends on next/headers."
 * Any value a Client Component needs must live in a file with no such
 * imports, which is exactly what this file is for.
 */
export const CATALOG_PAGE_SIZE = 12;

export type DeveloperHubSearchParams = {
  q?: string;
  types?: string;
  difficulty?: string;
  price?: string;
  sort?: string;
  page?: string;
};

/** GitHub Explorer's own URL param shape - distinct from `DeveloperHubSearchParams` since repo facets (language/license/organization/topics/stars/updated) don't map to the generic catalog's type/difficulty/price filters. */
export type GithubExplorerSearchParams = {
  q?: string;
  lang?: string;
  license?: string;
  org?: string;
  topic?: string;
  stars?: string;
  updated?: string;
  sort?: string;
  page?: string;
};

export type CatalogResourceType =
  | "certification"
  | "course"
  | "learning-path"
  | "github-repo"
  | "developer-tool"
  | "roadmap"
  | "cheat-sheet";

export const RESOURCE_TYPE_LABELS: Record<CatalogResourceType, string> = {
  certification: "Certifications",
  course: "Courses",
  "learning-path": "Learning Paths",
  "github-repo": "GitHub Repositories",
  "developer-tool": "Developer Tools",
  roadmap: "Roadmaps",
  "cheat-sheet": "Cheat Sheets",
};

/**
 * Premium-polish pass: a distinct soft pastel color per resource type
 * (instead of every card's Type badge being the same blue) so the
 * catalog reads more like a differentiated product taxonomy at a glance
 * - certifications green, learning paths blue, courses violet, tools
 * orange, GitHub repos amber, roadmaps rose, cheat sheets sky.
 */
export const RESOURCE_TYPE_BADGE_CLASSES: Record<CatalogResourceType, string> = {
  certification: "bg-emerald-50 text-emerald-700",
  "learning-path": "bg-blue-50 text-blue-700",
  course: "bg-violet-50 text-violet-700",
  "developer-tool": "bg-orange-50 text-orange-700",
  "github-repo": "bg-amber-50 text-amber-700",
  roadmap: "bg-rose-50 text-rose-700",
  "cheat-sheet": "bg-sky-50 text-sky-700",
};

/**
 * Contextual hover CTA copy for Editor's Picks (`FeaturedResourceCard`) -
 * "View Certification" reads far more like a real product than a
 * generic "Learn More" repeated on every card, and costs nothing extra
 * since the resource type is already known.
 */
export const RESOURCE_TYPE_CTA_LABELS: Record<CatalogResourceType, string> = {
  certification: "View Certification",
  course: "Start Course",
  "learning-path": "Start Path",
  "github-repo": "Open Repository",
  "developer-tool": "Visit Tool",
  roadmap: "Open Roadmap",
  "cheat-sheet": "View Cheat Sheet",
};
