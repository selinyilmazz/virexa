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

// ============================================================================
// GitHub Explorer redesign ("Developer Knowledge Library") - repositories
// table-backed types/constants shared between the server-only
// `github-explorer-service.ts` and Client Components (`GithubFiltersPanel`,
// `GithubSortControl`, repo cards). See that migration's doc comment
// (0024_repositories_editorial_and_collections.sql) for why `category` is
// a small fixed taxonomy rather than free text.
// ============================================================================

export type RepositoryCategorySlug =
  | "ai-agents"
  | "developer-productivity"
  | "system-design"
  | "frontend"
  | "backend"
  | "devops"
  | "cyber-security"
  | "mobile-development"
  | "learning-resources";

/** Label + emoji for each "Featured Collections" quick-filter card. */
export const REPOSITORY_CATEGORY_LABELS: Record<RepositoryCategorySlug, { label: string; emoji: string }> = {
  "ai-agents": { label: "AI Agents", emoji: "🤖" },
  "developer-productivity": { label: "Developer Productivity", emoji: "⚡" },
  "system-design": { label: "System Design", emoji: "🏗️" },
  frontend: { label: "Frontend", emoji: "🎨" },
  backend: { label: "Backend", emoji: "🗄️" },
  devops: { label: "DevOps", emoji: "🚀" },
  "cyber-security": { label: "Cyber Security", emoji: "🔒" },
  "mobile-development": { label: "Mobile Development", emoji: "📱" },
  "learning-resources": { label: "Learning Resources", emoji: "📚" },
};

export const REPOSITORY_CATEGORY_ORDER: RepositoryCategorySlug[] = [
  "ai-agents",
  "developer-productivity",
  "system-design",
  "frontend",
  "backend",
  "devops",
  "cyber-security",
  "mobile-development",
  "learning-resources",
];

export type RepositoryDifficultySlug = "beginner" | "intermediate" | "advanced";

export const REPOSITORY_DIFFICULTY_LABELS: Record<RepositoryDifficultySlug, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export type GithubLibrarySort =
  | "editor-pick"
  | "useful"
  | "stars"
  | "forks"
  | "watchers"
  | "newest"
  | "updated"
  | "health"
  | "bookmarked";

export const GITHUB_LIBRARY_SORT_OPTIONS: { value: GithubLibrarySort; label: string }[] = [
  { value: "editor-pick", label: "Editor's Pick" },
  { value: "useful", label: "Most Useful" },
  { value: "stars", label: "Most Stars" },
  { value: "forks", label: "Most Forks" },
  { value: "watchers", label: "Most Watchers" },
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently Updated" },
  { value: "health", label: "Best Health Score" },
  { value: "bookmarked", label: "Most Bookmarked" },
];

/** The GitHub Explorer library page's full URL query-param shape - every filter round-trips through `?...` so a reload/share preserves the exact same result set (spec requirement: filters "persist via URL query params across reload"). */
export type GithubLibrarySearchParams = {
  q?: string;
  category?: string;
  lang?: string;
  license?: string;
  minStars?: string;
  updated?: string;
  minHealth?: string;
  difficulty?: string;
  maintained?: string;
  verified?: string;
  editorPick?: string;
  hiddenGem?: string;
  beginnerFriendly?: string;
  aiRelated?: string;
  devTool?: string;
  cli?: string;
  library?: string;
  framework?: string;
  template?: string;
  tutorial?: string;
  collection?: string;
  onlyCurated?: string;
  onlyActive?: string;
  onlyTrending?: string;
  bookmarked?: string;
  sort?: string;
  page?: string;
};

/**
 * `repositories.id` is a real `owner/repo` full name (e.g.
 * "vercel/next.js") - safe as a Supabase primary key and a bookmark slug,
 * but not safe as a single Next.js dynamic route segment (the `/` would
 * be read as two segments). These two helpers are the one place that
 * boundary is crossed, so `/developer-hub/github/[slug]` always agrees
 * with whatever built the link.
 */
export function repoIdToSlug(id: string): string {
  return id.replace("/", "--");
}

export function repoSlugToId(slug: string): string {
  return slug.replace("--", "/");
}
