import { createClient } from "@/lib/supabase/server";
import { createRepositoryRepository } from "@/repositories/repository-repository";
import type { RepositoryRow } from "@/types/database";

/**
 * Data layer for the Open Source Explorer page.
 *
 * Admin Panel: Repositories - this used to call `getTrendingGithubRepos()`
 * directly (a fixed in-code list, live-fetched from GitHub on every
 * request, nothing an admin could manage). It now reads the
 * admin-managed `repositories` table instead (`visible = true` only, via
 * the public request-scoped client - RLS enforces that filter even if
 * this function forgot to, see `supabase/migrations/0018_repositories.sql`),
 * so `/admin/repositories` genuinely controls what appears here. Stars/
 * forks/language/etc. are still real GitHub data - just periodically
 * refreshed into this table (`repository-sync-service.ts`) instead of
 * fetched inline on every page view.
 */

export type OpenSourceSort = "trending" | "new" | "stars" | "forks" | "updated";

export const OPEN_SOURCE_SORT_OPTIONS: { value: OpenSourceSort; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "new", label: "New" },
  { value: "stars", label: "Most Starred" },
  { value: "forks", label: "Most Forked" },
  { value: "updated", label: "Recently Updated" },
];

export type OpenSourceRepoItem = {
  /** 1-based position within the full, filtered/sorted result set (not just the current page) - the card's rank number. */
  rank: number;
  /** `owner/repo`, e.g. "vercel/next.js" - stable and unique, used as the bookmark slug and React key. */
  id: string;
  owner: string;
  repoName: string;
  /** Lookup key into `resolveBrandVisual()` - always `id` (repo `full_name`), matching `GithubRepoCard`'s convention so every tracked repo gets its real hand-crafted brand mark instead of a generic avatar. */
  brandKey: string;
  description: string;
  language: string | null;
  license: string | null;
  stars: number;
  forks: number;
  updatedAtIso: string;
  updatedRelative: string;
  url: string;
  topics: string[];
  /** True if this repo has been hand-curated by an admin (`featured` on the `repositories` row) - not shown as a fake GitHub badge, just an internal editorial signal available to callers that want it. */
  featured: boolean;
};

export type OpenSourceTopic = { name: string; count: number };

export type OpenSourceExplorerParams = {
  query?: string;
  topic?: string;
  sort?: OpenSourceSort;
  page?: number;
  pageSize?: number;
};

export type OpenSourceExplorerResult = {
  items: OpenSourceRepoItem[];
  total: number;
  page: number;
  totalPages: number;
  /** Real topic frequency across the tracked repo pool (not a fabricated site-wide GitHub count) - see `computeTopics`. */
  topics: OpenSourceTopic[];
};

export const OPEN_SOURCE_PAGE_SIZE = 8;

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

function toItem(repo: RepositoryRow, rank: number): OpenSourceRepoItem {
  const updatedAtIso = repo.last_synced_at ?? repo.updated_at;
  return {
    rank,
    id: repo.id,
    owner: repo.owner,
    repoName: repo.repo_name,
    brandKey: repo.id,
    description: repo.description || "No description provided.",
    language: repo.language,
    license: repo.license,
    stars: repo.stars,
    forks: repo.forks,
    updatedAtIso,
    updatedRelative: formatRelative(updatedAtIso),
    url: repo.github_url,
    topics: repo.topics,
    featured: repo.featured,
  };
}

/**
 * Real topic frequency across the currently tracked repo pool. Honest by
 * construction: with a small admin-curated pool, this never produces the
 * eye-catching "12.6k" style counts a site-wide GitHub topic browser
 * would show - it shows exactly how many *tracked* repos carry each
 * topic, so clicking one always filters to a real, non-empty result for
 * every topic listed.
 */
function computeTopics(repos: RepositoryRow[]): OpenSourceTopic[] {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    for (const topic of repo.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Filters/sorts/paginates the admin-managed, visible repo pool for the
 * Open Source Explorer page. `sort: "trending"` (the default tab)
 * intentionally leaves the pool in its stored order (`stars desc` - see
 * `repository-repository.ts`'s `list()`) rather than re-deriving a
 * separate trending order.
 */
export async function getOpenSourceRepos(params: OpenSourceExplorerParams = {}): Promise<OpenSourceExplorerResult> {
  // Regression fix (stabilization pass): this used to let a Postgrest
  // error (e.g. the `repositories` table/columns not existing yet in a
  // not-fully-migrated environment, or a transient RLS/network hiccup)
  // propagate straight out of this function. Since this runs inside a
  // Server Component's render with no surrounding try/catch, that turned
  // into an uncaught rejection and the whole /open-source page rendered
  // Next.js's generic "Something went wrong" error boundary instead of
  // the page itself. Same "fail open, never break rendering over a soft
  // data problem" convention used elsewhere in this codebase (see
  // `article-read-service.ts`'s `visible !== false` fix) - an empty repo
  // pool still renders correctly via this page's existing "No
  // repositories match this filter yet." empty state.
  let repos: RepositoryRow[] = [];
  try {
    const supabase = await createClient();
    repos = await createRepositoryRepository(supabase).list({ visibleOnly: true });
  } catch (error) {
    console.error("[open-source-service] Failed to load repositories, rendering empty pool instead of crashing", error);
  }
  const topics = computeTopics(repos);

  let filtered = repos;

  if (params.query) {
    const needle = params.query.trim().toLowerCase();
    if (needle) {
      filtered = filtered.filter((repo) => `${repo.id} ${repo.description}`.toLowerCase().includes(needle));
    }
  }

  if (params.topic) {
    const topic = params.topic;
    filtered = filtered.filter((repo) => repo.topics.includes(topic));
  }

  const sorted = [...filtered].sort((a, b) => {
    switch (params.sort) {
      case "forks":
        return b.forks - a.forks;
      case "updated":
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case "new":
        return new Date(b.repo_created_at ?? b.created_at).getTime() - new Date(a.repo_created_at ?? a.created_at).getTime();
      case "stars":
        return b.stars - a.stars;
      case "trending":
      default:
        return 0;
    }
  });

  const pageSize = params.pageSize ?? OPEN_SOURCE_PAGE_SIZE;
  const page = Math.max(1, params.page ?? 1);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize).map((repo, index) => toItem(repo, start + index + 1));

  return { items, total, page: clampedPage, totalPages, topics };
}
