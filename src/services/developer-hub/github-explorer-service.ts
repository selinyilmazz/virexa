import { createClient } from "@/lib/supabase/server";
import { createRepositoryRepository } from "@/repositories/repository-repository";
import { createCollectionRepository } from "@/repositories/collection-repository";
import { createBookmarkRepository } from "@/repositories/bookmark-repository";
import {
  REPOSITORY_CATEGORY_ORDER,
  repoIdToSlug,
  type GithubLibrarySort,
  type RepositoryCategorySlug,
  type RepositoryDifficultySlug,
} from "@/lib/developer-hub/shared";
import type { CollectionRow, RepositoryRow } from "@/types/database";

/**
 * The real, `repositories`-table-backed data layer for the GitHub
 * Explorer "Developer Knowledge Library" redesign - replaces the old
 * `getGithubExplorerItems()` in `developer-hub-service.ts`, which read
 * from `getTrendingGithubRepos()` (a live, un-curatable GitHub API pool
 * with no admin control and none of the new editorial fields from
 * `0024_repositories_editorial_and_collections.sql`). Every list here is
 * the admin-managed `repositories` table, `visible = true` and
 * `archived = false` only (RLS enforces the same filter independently -
 * see that migration - so this stays correct even if a call site forgot
 * to ask for it).
 *
 * SERVER-ONLY MODULE: imports `@/lib/supabase/server` (built on
 * `next/headers`). Client Components must get their constants from
 * `@/lib/developer-hub/shared` instead (see that file's doc comment for
 * why this split exists).
 */

export type GithubRepoCardData = {
  /** `owner/repo` - the real GitHub full name, also the Supabase primary key and bookmark slug. */
  id: string;
  /** URL-safe slug for `/developer-hub/github/[slug]` - see `repoIdToSlug`. */
  slug: string;
  owner: string;
  repoName: string;
  fullName: string;
  avatarUrl: string;
  coverImageUrl: string | null;
  description: string;
  language: string | null;
  license: string | null;
  stars: number;
  forks: number;
  watchers: number;
  topics: string[];
  githubUrl: string;
  updatedAtIso: string;
  updatedRelative: string;
  repoCreatedAtIso: string | null;
  latestReleaseTag: string | null;
  latestReleasePublishedAtIso: string | null;
  category: RepositoryCategorySlug | null;
  difficulty: RepositoryDifficultySlug | null;
  editorPick: boolean;
  hiddenGem: boolean;
  verified: boolean;
  maintained: boolean;
  trending: boolean;
  featured: boolean;
  healthScore: number;
  recommendationScore: number;
  /** The "Why it's recommended" editorial blurb (2-3 sentences) - see 0024's doc comment. Empty string when an admin hasn't written one yet. */
  editorNotes: string;
  audience: string;
  tags: string[];
  /** Real save count across every user - `undefined` until batch-loaded (see `attachBookmarkCounts`), never fabricated. */
  bookmarkCount?: number;
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Math.max(0, Date.now() - then);
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diffMs < hour) return `${Math.max(1, Math.round(diffMs / minute))} minutes ago`;
  if (diffMs < day) return `${Math.round(diffMs / hour)} hours ago`;
  if (diffMs < week) return `${Math.round(diffMs / day)} days ago`;
  if (diffMs < month) return `${Math.round(diffMs / week)} weeks ago`;
  if (diffMs < year) return `${Math.round(diffMs / month)} months ago`;
  return `${Math.round(diffMs / year)} years ago`;
}

function toCardData(repo: RepositoryRow): GithubRepoCardData {
  const updatedAtIso = repo.last_synced_at ?? repo.updated_at;
  return {
    id: repo.id,
    slug: repoIdToSlug(repo.id),
    owner: repo.owner,
    repoName: repo.repo_name,
    fullName: repo.id,
    avatarUrl: `https://github.com/${repo.owner}.png`,
    coverImageUrl: repo.cover_image_url ?? null,
    description: repo.description || "No description provided.",
    language: repo.language,
    license: repo.license,
    stars: repo.stars,
    forks: repo.forks,
    watchers: repo.watchers,
    // Some deployed Supabase projects can briefly serve rows from before
    // migration 0024 reaches the schema cache. Treat absent array fields
    // as empty during that rollout rather than letting a detail page fail.
    topics: repo.topics ?? [],
    githubUrl: repo.github_url,
    updatedAtIso,
    updatedRelative: formatRelative(updatedAtIso),
    repoCreatedAtIso: repo.repo_created_at,
    latestReleaseTag: repo.latest_release_tag,
    latestReleasePublishedAtIso: repo.latest_release_published_at,
    category: repo.category,
    difficulty: repo.difficulty,
    editorPick: repo.editor_pick,
    hiddenGem: repo.hidden_gem,
    verified: repo.verified,
    maintained: repo.maintained,
    trending: repo.trending,
    featured: repo.featured,
    healthScore: repo.health_score,
    recommendationScore: repo.recommendation_score,
    editorNotes: repo.editor_notes,
    audience: repo.audience ?? "",
    tags: repo.tags ?? [],
  };
}

/**
 * Fail-open pool loader - same "never crash rendering over a soft data
 * problem" convention as `open-source-service.ts`'s `getOpenSourceRepos`.
 * An empty pool still renders a correct empty state rather than an
 * uncaught-rejection error boundary.
 */
async function loadVisiblePool(): Promise<RepositoryRow[]> {
  const { rows } = await loadVisiblePoolWithStatus();
  return rows;
}

/**
 * Same fail-open pool loader as `loadVisiblePool`, but also reports
 * whether the load itself failed (a real DB/network error) versus simply
 * returning zero rows (a healthy, empty table). `getGithubLibraryRepos`
 * surfaces this as `dataUnavailable` so the page can render a genuine
 * error state ("Something went wrong loading repositories") instead of
 * silently reusing the same copy as a true empty-filter result - the
 * spec's explicit "loading/empty/error states" requirement.
 */
async function loadVisiblePoolWithStatus(): Promise<{ rows: RepositoryRow[]; failed: boolean }> {
  try {
    const supabase = await createClient();
    const rows = await createRepositoryRepository(supabase).list({ visibleOnly: true });
    return { rows, failed: false };
  } catch (error) {
    console.error("[github-explorer-service] Failed to load repositories, rendering empty pool instead of crashing", error);
    return { rows: [], failed: true };
  }
}

/**
 * Batch-attaches real bookmark counts (`bookmarks` table, `item_type =
 * "repository"`) onto a page of already-paginated items - only ever
 * called for the current page's ids (bounded, never the whole pool), so
 * "Most Bookmarked" sort/badge is real data without turning every list
 * render into a table scan.
 */
async function attachBookmarkCounts(items: GithubRepoCardData[]): Promise<GithubRepoCardData[]> {
  if (items.length === 0) return items;
  try {
    const supabase = await createClient();
    const counts = await createBookmarkRepository(supabase).getCountsByItemType(
      "repository",
      items.map((item) => item.id)
    );
    return items.map((item) => ({ ...item, bookmarkCount: counts.get(item.id) ?? 0 }));
  } catch (error) {
    console.error("[github-explorer-service] Failed to load bookmark counts, showing items without them", error);
    return items.map((item) => ({ ...item, bookmarkCount: 0 }));
  }
}

const UPDATED_WINDOW_MS: Record<string, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};

export type GithubLibraryParams = {
  query?: string;
  category?: RepositoryCategorySlug;
  language?: string;
  license?: string;
  minStars?: number;
  updatedWithin?: "day" | "week" | "month" | "year";
  minHealth?: number;
  difficulty?: RepositoryDifficultySlug;
  maintained?: boolean;
  verified?: boolean;
  editorPick?: boolean;
  hiddenGem?: boolean;
  beginnerFriendly?: boolean;
  /** Editorial tag filters (`repositories.tags`) - "AI Related"/"Dev Tool"/"CLI"/"Library"/"Framework"/"Template"/"Tutorial" checkboxes each map to one canonical tag string. */
  tags?: string[];
  /** A named admin-curated collection slug (distinct from `category`) - see `collection-repository.ts`. */
  collectionSlug?: string;
  onlyTrending?: boolean;
  bookmarked?: boolean;
  sort?: GithubLibrarySort;
  page?: number;
  pageSize?: number;
};

export type GithubLibraryFacets = {
  languages: string[];
  licenses: string[];
  categories: RepositoryCategorySlug[];
};

export type GithubLibraryResult = {
  items: GithubRepoCardData[];
  total: number;
  page: number;
  totalPages: number;
  facets: GithubLibraryFacets;
  /** `true` only when the underlying repository load itself failed (a real DB/network error) - distinct from a healthy zero-match filter result. */
  dataUnavailable: boolean;
};

export const GITHUB_LIBRARY_PAGE_SIZE = 12;

/** Canonical tag strings the checkbox filters map to - see `0024`'s doc comment on `repositories.tags` (Virexa's own curation vocabulary, distinct from GitHub `topics`). */
export const REPOSITORY_TAG_FILTERS = {
  aiRelated: "AI Related",
  devTool: "Dev Tool",
  cli: "CLI",
  library: "Library",
  framework: "Framework",
  template: "Template",
  tutorial: "Tutorial",
} as const;

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

/**
 * Filters/sorts/paginates the real, admin-curated repository pool for the
 * GitHub Explorer library page. `facets` (languages/licenses/categories)
 * are always computed from the FULL visible pool before any filter is
 * applied, so a facet option never silently disappears just because
 * another filter narrowed the result set - same faceted-search principle
 * `getGithubExplorerItems` already used.
 */
export async function getGithubLibraryRepos(params: GithubLibraryParams = {}): Promise<GithubLibraryResult> {
  const { rows: pool, failed: dataUnavailable } = await loadVisiblePoolWithStatus();

  const facets: GithubLibraryFacets = {
    languages: uniqueSorted(pool.map((r) => r.language).filter((v): v is string => Boolean(v))),
    licenses: uniqueSorted(pool.map((r) => r.license).filter((v): v is string => Boolean(v))),
    categories: REPOSITORY_CATEGORY_ORDER.filter((category) => pool.some((r) => r.category === category)),
  };

  let collectionMemberIds: Set<string> | null = null;
  if (params.collectionSlug) {
    try {
      const supabase = await createClient();
      const collectionRepository = createCollectionRepository(supabase);
      const collection = await collectionRepository.getBySlug(params.collectionSlug);
      collectionMemberIds = collection
        ? new Set((await collectionRepository.listRepositoriesForCollection(collection.id)).map((r) => r.id))
        : new Set();
    } catch (error) {
      console.error("[github-explorer-service] Failed to resolve collection filter, ignoring it", error);
      collectionMemberIds = null;
    }
  }

  let filtered = pool;

  if (params.bookmarked) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) filtered = [];
      else {
        const saved = await createBookmarkRepository(supabase).list(data.user.id);
        const savedIds = new Set(saved.filter((item) => item.type === "repository").map((item) => item.slug));
        filtered = filtered.filter((repo) => savedIds.has(repo.id));
      }
    } catch (error) {
      console.error("[github-explorer-service] Failed to load the user's saved repositories", error);
      filtered = [];
    }
  }

  if (params.query) {
    const needle = params.query.trim().toLowerCase();
    if (needle) {
      filtered = filtered.filter((repo) =>
        `${repo.owner} ${repo.repo_name} ${repo.description} ${(repo.topics ?? []).join(" ")} ${(repo.tags ?? []).join(" ")} ${repo.editor_notes ?? ""}`
          .toLowerCase()
          .includes(needle)
      );
    }
  }

  if (params.category) filtered = filtered.filter((repo) => repo.category === params.category);
  if (params.language) filtered = filtered.filter((repo) => repo.language === params.language);
  if (params.license) filtered = filtered.filter((repo) => repo.license === params.license);
  if (params.minStars !== undefined) filtered = filtered.filter((repo) => repo.stars >= params.minStars!);
  if (params.minHealth !== undefined) filtered = filtered.filter((repo) => repo.health_score >= params.minHealth!);
  if (params.difficulty) filtered = filtered.filter((repo) => repo.difficulty === params.difficulty);
  if (params.maintained !== undefined) filtered = filtered.filter((repo) => repo.maintained === params.maintained);
  if (params.verified !== undefined) filtered = filtered.filter((repo) => repo.verified === params.verified);
  if (params.editorPick !== undefined) filtered = filtered.filter((repo) => repo.editor_pick === params.editorPick);
  if (params.hiddenGem !== undefined) filtered = filtered.filter((repo) => repo.hidden_gem === params.hiddenGem);
  if (params.beginnerFriendly) filtered = filtered.filter((repo) => repo.difficulty === "beginner");
  if (params.onlyTrending) filtered = filtered.filter((repo) => repo.trending);
  if (params.tags && params.tags.length > 0) {
    const tagSet = new Set(params.tags);
    filtered = filtered.filter((repo) => (repo.tags ?? []).some((tag) => tagSet.has(tag)));
  }
  if (collectionMemberIds) filtered = filtered.filter((repo) => collectionMemberIds!.has(repo.id));

  if (params.updatedWithin) {
    const cutoff = Date.now() - UPDATED_WINDOW_MS[params.updatedWithin];
    filtered = filtered.filter((repo) => new Date(repo.last_synced_at ?? repo.updated_at).getTime() >= cutoff);
  }

  const sorted = [...filtered].sort((a, b) => {
    switch (params.sort) {
      case "forks":
        return b.forks - a.forks;
      case "watchers":
        return b.watchers - a.watchers;
      case "newest":
        return new Date(b.repo_created_at ?? b.created_at).getTime() - new Date(a.repo_created_at ?? a.created_at).getTime();
      case "updated":
        return new Date(b.last_synced_at ?? b.updated_at).getTime() - new Date(a.last_synced_at ?? a.updated_at).getTime();
      case "health":
        return b.health_score - a.health_score;
      case "useful":
        return b.recommendation_score + b.health_score - (a.recommendation_score + a.health_score);
      case "bookmarked":
        return 0; // resolved after bookmark counts are attached below.
      case "stars":
        return b.stars - a.stars;
      case "editor-pick":
      default:
        if (a.editor_pick !== b.editor_pick) return a.editor_pick ? -1 : 1;
        return b.recommendation_score - a.recommendation_score;
    }
  });

  const pageSize = params.pageSize ?? GITHUB_LIBRARY_PAGE_SIZE;
  const page = Math.max(1, params.page ?? 1);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;

  let items = sorted.slice(start, start + pageSize).map(toCardData);

  if (params.sort === "bookmarked") {
    // "Most Bookmarked" needs a real per-repo save count, which only
    // exists in the `bookmarks` table - fetched for the WHOLE filtered
    // set (not just one page) so the sort itself is correct, then the
    // page window is re-sliced from that order. Bounded by the filtered
    // result size, same cost class as a real ORDER BY on a join would be.
    const allFiltered = filtered.map(toCardData);
    const withCounts = await attachBookmarkCounts(allFiltered);
    withCounts.sort((a, b) => (b.bookmarkCount ?? 0) - (a.bookmarkCount ?? 0));
    items = withCounts.slice(start, start + pageSize);
  } else {
    items = await attachBookmarkCounts(items);
  }

  return { items, total, page: clampedPage, totalPages, facets, dataUnavailable };
}

export type GithubQuickStats = {
  /** Total curated (visible, non-archived) repositories - "Curated Repositories". */
  curatedRepositoriesCount: number;
  /** `hidden_gem = true` - "Hidden Gems". */
  hiddenGemsCount: number;
  /** `category = "ai-agents"` - "AI Agent Repositories". */
  aiAgentRepositoriesCount: number;
  /** `category = "learning-resources"` - "Learning Resources". */
  learningResourcesCount: number;
};

/**
 * Every number here is a real `repositories` table count - the spec's
 * explicit "gerçek repository datasından hesaplanmalı, hardcoded olmasın"
 * requirement. Computed from the same visible pool every other function
 * in this module reads, so the Quick Stats strip can never drift from
 * what the list below it actually shows.
 */
export async function getGithubQuickStats(): Promise<GithubQuickStats> {
  const pool = await loadVisiblePool();
  return {
    curatedRepositoriesCount: pool.length,
    hiddenGemsCount: pool.filter((r) => r.hidden_gem).length,
    aiAgentRepositoriesCount: pool.filter((r) => r.category === "ai-agents").length,
    learningResourcesCount: pool.filter((r) => r.category === "learning-resources").length,
  };
}

export type GithubFeaturedCollection = {
  categorySlug: RepositoryCategorySlug;
  repoCount: number;
};

/** Real per-category counts across the visible pool - backs the "Featured Collections" quick-filter cards (each card links to `?category=<slug>`). Categories with zero matching repos are still returned (count 0) so the grid stays a fixed, stable 9-card layout rather than reflowing as curation grows. */
export async function getFeaturedCategoryCollections(): Promise<GithubFeaturedCollection[]> {
  const pool = await loadVisiblePool();
  return REPOSITORY_CATEGORY_ORDER.map((categorySlug) => ({
    categorySlug,
    repoCount: pool.filter((r) => r.category === categorySlug).length,
  }));
}

/** Admin-curated named collections (distinct from the fixed category taxonomy) with real membership counts - only `visible = true` ones, for the public page. */
export async function getVisibleCollections(): Promise<(CollectionRow & { repoCount: number })[]> {
  try {
    const supabase = await createClient();
    const collectionRepository = createCollectionRepository(supabase);
    const collections = await collectionRepository.listVisible();
    const withCounts = await Promise.all(
      collections.map(async (collection) => ({
        ...collection,
        repoCount: (await collectionRepository.listRepositoriesForCollection(collection.id)).length,
      }))
    );
    return withCounts;
  } catch (error) {
    console.error("[github-explorer-service] Failed to load collections, rendering none", error);
    return [];
  }
}

/** A small carousel pool for the Hero's auto-sliding repo cards - editor's picks first, then highest-recommendation repos, capped at `limit`. Real curated data, not a fixed hardcoded list. */
export async function getHeroCarouselRepos(limit = 10): Promise<GithubRepoCardData[]> {
  const pool = await loadVisiblePool();
  const sorted = [...pool].sort((a, b) => {
    if (a.editor_pick !== b.editor_pick) return a.editor_pick ? -1 : 1;
    return b.recommendation_score - a.recommendation_score || b.stars - a.stars;
  });
  return sorted.slice(0, limit).map(toCardData);
}

/** Single repo lookup by URL slug, for `/developer-hub/github/[slug]`. Returns `null` for a not-found, hidden, or archived repo (the page renders a real 404 in that case, never a raw id lookup that could leak a hidden repo's existence). */
export async function getGithubRepoBySlug(slug: string): Promise<GithubRepoCardData | null> {
  const id = slug.includes("--") ? slug.replace("--", "/") : slug;
  try {
    const supabase = await createClient();
    const repo = await createRepositoryRepository(supabase).getById(id);
    if (!repo || !repo.visible || repo.archived) return null;
    const [withCount] = await attachBookmarkCounts([toCardData(repo)]);
    return withCount;
  } catch (error) {
    console.error("[github-explorer-service] Failed to load repository by slug", error);
    return null;
  }
}

/** Repos related to a given one: same `category` when set, otherwise repos sharing at least one topic/tag - excludes the repo itself, capped at `limit`. */
export async function getRelatedRepositories(repo: GithubRepoCardData, limit = 6): Promise<GithubRepoCardData[]> {
  const pool = await loadVisiblePool();
  const others = pool.filter((r) => r.id !== repo.id);

  let related: RepositoryRow[];
  if (repo.category) {
    related = others.filter((r) => r.category === repo.category);
  } else {
    const topicSet = new Set([...repo.topics, ...repo.tags]);
    related = others.filter((r) => (r.topics ?? []).some((t) => topicSet.has(t)) || (r.tags ?? []).some((t) => topicSet.has(t)));
  }

  related.sort((a, b) => b.stars - a.stars);
  return related.slice(0, limit).map(toCardData);
}

/**
 * "Alternatives" (distinct from "Related Repositories" above): repos
 * sharing at least one topic/tag with the given repo but in a DIFFERENT
 * category - the "if not this, maybe this instead" framing, versus
 * Related's "more like this" framing. A repo with no category (so
 * `getRelatedRepositories` already used topic/tag overlap) has no
 * meaningful distinction from Related, so this returns `[]` in that case
 * rather than duplicating the same list under a different heading.
 */
export async function getAlternativeRepositories(repo: GithubRepoCardData, limit = 4): Promise<GithubRepoCardData[]> {
  if (!repo.category) return [];
  const pool = await loadVisiblePool();
  const topicSet = new Set([...repo.topics, ...repo.tags]);
  if (topicSet.size === 0) return [];

  const alternatives = pool.filter(
    (r) => r.id !== repo.id && r.category !== repo.category && ((r.topics ?? []).some((t) => topicSet.has(t)) || (r.tags ?? []).some((t) => topicSet.has(t)))
  );
  alternatives.sort((a, b) => b.stars - a.stars);
  return alternatives.slice(0, limit).map(toCardData);
}

/**
 * "You May Also Like" - a broader discovery strip distinct from both
 * Related (same category) and Alternatives (cross-category topic
 * overlap): the site's overall highest-recommendation repos, excluding
 * this one and anything already shown in Related/Alternatives, so the
 * page doesn't repeat the same cards three times.
 */
export async function getYouMayAlsoLike(excludeIds: string[], limit = 6): Promise<GithubRepoCardData[]> {
  const pool = await loadVisiblePool();
  const excludeSet = new Set(excludeIds);
  const candidates = pool.filter((r) => !excludeSet.has(r.id));
  candidates.sort((a, b) => {
    if (a.editor_pick !== b.editor_pick) return a.editor_pick ? -1 : 1;
    return b.recommendation_score - a.recommendation_score || b.stars - a.stars;
  });
  return candidates.slice(0, limit).map(toCardData);
}

/** Which named collections (if any) a given repo belongs to - Repository Detail page context. */
export async function getCollectionsForRepository(repositoryId: string): Promise<CollectionRow[]> {
  try {
    const supabase = await createClient();
    const collectionRepository = createCollectionRepository(supabase);
    const ids = await collectionRepository.listCollectionIdsForRepository(repositoryId);
    if (ids.length === 0) return [];
    const all = await collectionRepository.listVisible();
    const idSet = new Set(ids);
    return all.filter((c) => idSet.has(c.id));
  } catch (error) {
    console.error("[github-explorer-service] Failed to load collections for repository", error);
    return [];
  }
}

export type GithubSidebarWidgets = {
  editorsPicks: GithubRepoCardData[];
  recentlyAdded: GithubRepoCardData[];
  mostBookmarked: GithubRepoCardData[];
  hiddenGems: GithubRepoCardData[];
  beginnerFriendly: GithubRepoCardData[];
  trendingThisMonth: GithubRepoCardData[];
};

/**
 * The 4 dynamic Repository Detail sidebar widgets in one batched call
 * (Editor's Picks / Recently Added / Most Bookmarked / Hidden Gems) -
 * loads the visible pool once and derives all 4 lists from it rather than
 * 4 separate round trips, same "one fetch, many views" pattern
 * `getDeveloperHubStats` already uses.
 */
export async function getGithubSidebarWidgets(excludeId?: string, limit = 5): Promise<GithubSidebarWidgets> {
  const pool = await loadVisiblePool();
  const eligible = excludeId ? pool.filter((r) => r.id !== excludeId) : pool;

  const editorsPicks = [...eligible]
    .filter((r) => r.editor_pick)
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, limit)
    .map(toCardData);

  const recentlyAdded = [...eligible]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
    .map(toCardData);

  const hiddenGems = [...eligible]
    .filter((r) => r.hidden_gem)
    .sort((a, b) => b.stars - a.stars)
    .slice(0, limit)
    .map(toCardData);

  const beginnerFriendly = [...eligible]
    .filter((r) => r.difficulty === "beginner")
    .sort((a, b) => b.recommendation_score - a.recommendation_score || b.stars - a.stars)
    .slice(0, limit)
    .map(toCardData);

  const trendingThisMonth = [...eligible]
    .filter((r) => r.trending)
    .sort((a, b) => new Date(b.last_synced_at ?? b.updated_at).getTime() - new Date(a.last_synced_at ?? a.updated_at).getTime())
    .slice(0, limit)
    .map(toCardData);

  const mostBookmarkedCandidates = await attachBookmarkCounts(eligible.map(toCardData));
  const mostBookmarked = [...mostBookmarkedCandidates]
    .sort((a, b) => (b.bookmarkCount ?? 0) - (a.bookmarkCount ?? 0))
    .slice(0, limit);

  return { editorsPicks, recentlyAdded, mostBookmarked, hiddenGems, beginnerFriendly, trendingThisMonth };
}

/** Parses `GithubLibrarySearchParams` (raw URL query strings) into typed `GithubLibraryParams` - the one place string-to-filter parsing happens, so the page component and any future caller (e.g. a sitemap or admin preview) stay in sync. */
export function parseGithubLibrarySearchParams(sp: {
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
  onlyTrending?: string;
  sort?: string;
  page?: string;
}): GithubLibraryParams {
  const tags: string[] = [];
  if (sp.aiRelated === "1") tags.push(REPOSITORY_TAG_FILTERS.aiRelated);
  if (sp.devTool === "1") tags.push(REPOSITORY_TAG_FILTERS.devTool);
  if (sp.cli === "1") tags.push(REPOSITORY_TAG_FILTERS.cli);
  if (sp.library === "1") tags.push(REPOSITORY_TAG_FILTERS.library);
  if (sp.framework === "1") tags.push(REPOSITORY_TAG_FILTERS.framework);
  if (sp.template === "1") tags.push(REPOSITORY_TAG_FILTERS.template);
  if (sp.tutorial === "1") tags.push(REPOSITORY_TAG_FILTERS.tutorial);

  const updatedWithin =
    sp.updated === "day" || sp.updated === "week" || sp.updated === "month" || sp.updated === "year" ? sp.updated : undefined;

  const difficulty =
    sp.difficulty === "beginner" || sp.difficulty === "intermediate" || sp.difficulty === "advanced" ? sp.difficulty : undefined;

  const category = REPOSITORY_CATEGORY_ORDER.includes(sp.category as RepositoryCategorySlug)
    ? (sp.category as RepositoryCategorySlug)
    : undefined;

  const sortValues: GithubLibrarySort[] = ["editor-pick", "stars", "forks", "watchers", "newest", "updated", "health", "bookmarked"];
  const sort = sortValues.includes(sp.sort as GithubLibrarySort) ? (sp.sort as GithubLibrarySort) : undefined;

  return {
    query: sp.q,
    category,
    language: sp.lang,
    license: sp.license,
    minStars: sp.minStars ? Number(sp.minStars) : undefined,
    updatedWithin,
    minHealth: sp.minHealth ? Number(sp.minHealth) : undefined,
    difficulty,
    maintained: sp.maintained === "1" ? true : undefined,
    verified: sp.verified === "1" ? true : undefined,
    editorPick: sp.editorPick === "1" ? true : undefined,
    hiddenGem: sp.hiddenGem === "1" ? true : undefined,
    beginnerFriendly: sp.beginnerFriendly === "1",
    tags: tags.length > 0 ? tags : undefined,
    collectionSlug: sp.collection,
    onlyTrending: sp.onlyTrending === "1",
    sort,
    page: sp.page ? Number(sp.page) : undefined,
  };
}
