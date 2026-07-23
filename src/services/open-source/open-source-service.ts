import { getTrendingGithubRepos, type GithubRepo } from "@/lib/developer-hub/github";

/**
 * Data layer for the Open Source Explorer page - deliberately separate
 * from `developer-hub-service.ts`'s `CatalogItem`/`getGithubExplorerItems`
 * (Developer Hub's GitHub Explorer). That layer normalizes repos into the
 * generic `CatalogItem` shape shared with certifications/courses/tools;
 * this page needs its own bespoke, repository-only model (rank, verified
 * signal, real per-repo topics) and its own five-way sort (Trending/New/
 * Most Starred/Most Forked/Recently Updated) that doesn't map cleanly
 * onto the catalog's generic stars/updated/name sort. Both layers read
 * from the same underlying `getTrendingGithubRepos()` live data source,
 * so there's exactly one place real GitHub data enters the app.
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

function toItem(repo: GithubRepo, rank: number): OpenSourceRepoItem {
  const [owner, ...rest] = repo.fullName.split("/");
  return {
    rank,
    id: repo.fullName,
    owner: owner ?? repo.fullName,
    repoName: rest.join("/") || repo.fullName,
    brandKey: repo.fullName,
    description: repo.description || "No description provided.",
    language: repo.language,
    license: repo.license,
    stars: repo.stars,
    forks: repo.forks,
    updatedAtIso: repo.updatedAt,
    updatedRelative: formatRelative(repo.updatedAt),
    url: repo.url,
    topics: repo.topics,
  };
}

/**
 * Real topic frequency across the currently tracked repo pool. Honest by
 * construction: with ~12 tracked repos this never produces the
 * eye-catching "12.6k" style counts a site-wide GitHub topic browser
 * would show - it shows exactly how many *tracked* repos carry each
 * topic, so clicking one always filters to a real, non-empty result for
 * every topic listed.
 */
function computeTopics(repos: GithubRepo[]): OpenSourceTopic[] {
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
 * Filters/sorts/paginates the live tracked-repo pool for the Open Source
 * Explorer page. `sort: "trending"` (the default tab) intentionally
 * leaves the pool in its original curated order rather than re-sorting
 * by stars - `TRACKED_REPOS` (see `lib/developer-hub/github.ts`) already
 * IS the hand-picked "trending" list, and re-sorting it would make
 * Trending and Most Starred identical tabs.
 */
export async function getOpenSourceRepos(params: OpenSourceExplorerParams = {}): Promise<OpenSourceExplorerResult> {
  const repos = await getTrendingGithubRepos();
  const topics = computeTopics(repos);

  let filtered = repos;

  if (params.query) {
    const needle = params.query.trim().toLowerCase();
    if (needle) {
      filtered = filtered.filter((repo) => `${repo.fullName} ${repo.description}`.toLowerCase().includes(needle));
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
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "new":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
