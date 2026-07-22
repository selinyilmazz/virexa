import {
  CERTIFICATIONS,
  CHEAT_SHEETS,
  COURSES,
  DEVELOPER_TOOLS,
  LEARNING_PATHS,
  ROADMAPS,
  type Difficulty,
  type Price,
} from "@/data/developer-hub";
import { getTrendingGithubRepos } from "@/lib/developer-hub/github";
import { RESOURCE_TYPE_LABELS, type CatalogResourceType } from "@/lib/developer-hub/shared";
import { getNewsExplorerArticles } from "@/services/articles/article-read-service";

/**
 * Developer Hub's unified catalog layer (Developer Hub redesign). Mirrors
 * the News Explorer's own "bounded candidate pool, filtered/sorted in
 * application code" convention (see `getNewsExplorerArticles`'s pooled
 * path) - except here the pool isn't a page of DB rows, it's every
 * curated static item (`src/data/developer-hub.ts`) plus live GitHub repo
 * data (`getTrendingGithubRepos`), normalized into one `CatalogItem`
 * shape so a single Filters sidebar / Sort control / pagination UI can
 * work across all of them (`CatalogExplorerView`).
 *
 * Deliberately excluded from this pool: article-backed "Releases" -
 * those are real, paginated DB rows already served perfectly well by the
 * existing unified Explorer (`ExplorerView` with `defaultContentType`
 * `"release"` - see `/developer-hub/releases/page.tsx`), so there's no
 * reason to re-implement that here. `getDeveloperHubStats` still reports
 * a real release count (via `getNewsExplorerArticles`) for the stats
 * strip, for the same reason the homepage's own stats strip does.
 *
 * SERVER-ONLY MODULE: this file imports `getNewsExplorerArticles` from
 * `article-read-service.ts`, which imports the Supabase *server* client
 * (`@/lib/supabase/server`, built on `next/headers`). That makes this
 * entire file, and everything it exports, unsafe to import from a
 * Client Component - doing so bundles the whole server-only chain into
 * client JS and crashes with "You're importing a module that depends on
 * next/headers." `CatalogResourceType`/`RESOURCE_TYPE_LABELS` are
 * re-exported here (not defined here) for existing server-side callers -
 * their real home is `@/lib/developer-hub/shared`, a plain
 * dependency-free module, which is what any Client Component (like
 * `CatalogFiltersPanel`) must import them from instead.
 */
export type { CatalogResourceType };
export { RESOURCE_TYPE_LABELS };

export type CatalogItem = {
  id: string;
  resourceType: CatalogResourceType;
  title: string;
  description: string;
  provider: string;
  url: string;
  emoji: string;
  difficulty?: Difficulty;
  price?: Price;
  /** A short pill under the title - e.g. a GitHub repo's primary language, or a cheat sheet's file type. */
  tag?: string;
  /** A flexible, always-real metric line - e.g. "Est. 3-6 months" (a roadmap's honest estimate). `undefined` when there's nothing truthful to show or when a more specialized meta row is rendered instead (see `stars`/`forks` below). */
  metaLine?: string;
  featured?: boolean;
  /** Lookup key into `resolveBrandVisual()` (`brand-icons.tsx`) - the item's `provider` for everything except GitHub repos, which key by their own `owner/repo` `fullName` instead so each repo shows its own project branding rather than a generic GitHub mark. */
  brandKey: string;
  /** `true` only for real, official certification programs (every curated certification currently qualifies) - powers the card's small "Official" badge. */
  official?: boolean;
  /** 4-5 real topic areas, in order - powers the roadmap card's mini step-preview instead of a plain icon (roadmaps only). */
  steps?: string[];
  // GitHub-repo-specific real, live fields (only set when `resourceType === "github-repo"`) - kept discrete rather than pre-formatted into `metaLine` so `CatalogCard` can render a proper repo meta row (language dot, star/fork icons) instead of a plain string.
  owner?: string;
  repoName?: string;
  stars?: number;
  forks?: number;
  updatedRelative?: string;
  /** Real SPDX identifier/name from GitHub's own license detection (e.g. "MIT"). `undefined` when GitHub hasn't detected one, or for non-repo items. */
  license?: string;
  /** Real repo topics set by the maintainers on GitHub. Only set for GitHub repo items. */
  topics?: string[];
  /** Raw ISO timestamp backing `updatedRelative` - kept alongside the human-readable string so `getGithubExplorerItems`'s "Updated within" filter can do real date-window math instead of parsing the relative string. */
  updatedAtIso?: string;
};

function formatCompactNumber(value: number): string {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatRelativeFromNow(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

async function buildCatalogPool(): Promise<CatalogItem[]> {
  const certifications: CatalogItem[] = CERTIFICATIONS.map((item) => ({
    id: `certification:${item.slug}`,
    resourceType: "certification",
    title: item.title,
    description: item.description,
    provider: item.provider,
    url: item.url,
    emoji: item.emoji,
    difficulty: item.difficulty,
    price: item.price,
    featured: item.featured,
    brandKey: item.provider,
    official: item.official,
  }));

  const courses: CatalogItem[] = COURSES.map((item) => ({
    id: `course:${item.slug}`,
    resourceType: "course",
    title: item.title,
    description: item.description,
    provider: item.provider,
    url: item.url,
    emoji: item.emoji,
    difficulty: item.difficulty,
    price: item.price,
    featured: item.featured,
    brandKey: item.provider,
  }));

  const learningPaths: CatalogItem[] = LEARNING_PATHS.map((item) => ({
    id: `learning-path:${item.slug}`,
    resourceType: "learning-path",
    title: item.title,
    description: item.description,
    provider: item.provider,
    url: item.url,
    emoji: item.emoji,
    difficulty: item.difficulty,
    price: item.price,
    featured: item.featured,
    brandKey: item.provider,
  }));

  const developerTools: CatalogItem[] = DEVELOPER_TOOLS.map((item) => ({
    id: `developer-tool:${item.slug}`,
    resourceType: "developer-tool",
    title: item.title,
    description: item.description,
    provider: item.provider,
    url: item.url,
    emoji: item.emoji,
    price: item.price,
    featured: item.featured,
    brandKey: item.provider,
  }));

  const roadmaps: CatalogItem[] = ROADMAPS.map((item) => ({
    id: `roadmap:${item.slug}`,
    resourceType: "roadmap",
    title: item.title,
    description: item.description,
    provider: item.provider,
    url: item.url,
    emoji: item.emoji,
    difficulty: item.difficulty,
    metaLine: `Est. ${item.estimatedTime}`,
    featured: item.featured,
    brandKey: item.provider,
    steps: item.steps,
  }));

  const cheatSheets: CatalogItem[] = CHEAT_SHEETS.map((item) => ({
    id: `cheat-sheet:${item.slug}`,
    resourceType: "cheat-sheet",
    title: item.title,
    description: item.description,
    provider: item.provider,
    url: item.url,
    emoji: item.emoji,
    price: "free",
    tag: item.fileType,
    featured: item.featured,
    // Keyed by the cheat sheet's own slug (not `item.provider`) so each
    // one shows the actual technology's brand (Git/Docker/Kubernetes/
    // Python/Postgres) instead of all sharing one generic "devhints.io"
    // tile - see `BRAND_VISUALS`' per-slug entries in `brand-icons.tsx`.
    brandKey: item.slug,
  }));

  const githubRepos = await getTrendingGithubRepos();
  const githubItems: CatalogItem[] = githubRepos.map((repo) => {
    const [owner, repoName] = repo.fullName.split("/");
    return {
      id: `github-repo:${repo.slug}`,
      resourceType: "github-repo",
      title: repo.fullName,
      description: repo.description || "No description provided.",
      provider: "GitHub",
      url: repo.url,
      emoji: "🐙",
      price: "free",
      tag: repo.language ?? undefined,
      metaLine: `★ ${formatCompactNumber(repo.stars)} · ${formatCompactNumber(repo.forks)} forks · Updated ${formatRelativeFromNow(repo.updatedAt)}`,
      featured: repo.stars > 50000,
      brandKey: repo.fullName,
      owner,
      repoName,
      stars: repo.stars,
      forks: repo.forks,
      updatedRelative: formatRelativeFromNow(repo.updatedAt),
      license: repo.license ?? undefined,
      topics: repo.topics,
      updatedAtIso: repo.updatedAt,
    };
  });

  return [...certifications, ...courses, ...learningPaths, ...githubItems, ...developerTools, ...roadmaps, ...cheatSheets];
}

export type CatalogSort = "featured" | "az";

export type CatalogParams = {
  query?: string;
  resourceTypes?: CatalogResourceType[];
  difficulties?: Difficulty[];
  prices?: Price[];
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
};

export type CatalogItemsPage = {
  items: CatalogItem[];
  total: number;
  page: number;
  totalPages: number;
};

const DEFAULT_PAGE_SIZE = 12;

/**
 * Filters/sorts/paginates the full catalog pool in application code (see
 * this module's doc comment for why - the pool is small and lives
 * partly in-memory, partly as a short-TTL live cache, so there's no
 * database query to push this work down into). Every filter is
 * inclusive-of-empty: an item with no `difficulty` (e.g. a GitHub repo)
 * simply won't match if the Difficulty filter is active, same as a real
 * DB column would behave.
 */
export async function getCatalogItems(params: CatalogParams = {}): Promise<CatalogItemsPage> {
  const pool = await buildCatalogPool();
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = Math.max(1, params.page ?? 1);

  let filtered = pool;

  if (params.resourceTypes && params.resourceTypes.length > 0) {
    const typeSet = new Set(params.resourceTypes);
    filtered = filtered.filter((item) => typeSet.has(item.resourceType));
  }

  if (params.difficulties && params.difficulties.length > 0) {
    const difficultySet = new Set(params.difficulties);
    filtered = filtered.filter((item) => item.difficulty !== undefined && difficultySet.has(item.difficulty));
  }

  if (params.prices && params.prices.length > 0) {
    const priceSet = new Set(params.prices);
    filtered = filtered.filter((item) => item.price !== undefined && priceSet.has(item.price));
  }

  if (params.query) {
    const needle = params.query.trim().toLowerCase();
    if (needle) {
      filtered = filtered.filter((item) =>
        `${item.title} ${item.description} ${item.provider}`.toLowerCase().includes(needle)
      );
    }
  }

  const sorted = [...filtered].sort((a, b) => {
    if (params.sort === "az") return a.title.localeCompare(b.title);
    // "featured" (default): featured items first, then alphabetical within each group.
    if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
    return a.title.localeCompare(b.title);
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  return { items, total, page: clampedPage, totalPages };
}

/**
 * Curated highlights across every resource type - powers the Developer
 * Hub landing page's "Featured Resources" preview. Round-robins across
 * resource types (rather than taking the first `limit` featured items in
 * pool order) so the preview showcases variety - certifications happen
 * to have the most `featured: true` entries in the curated data, and a
 * plain `.slice()` would otherwise fill the whole preview with just
 * those.
 */
export async function getFeaturedCatalogItems(limit = 6): Promise<CatalogItem[]> {
  const pool = await buildCatalogPool();
  const featuredByType = new Map<CatalogResourceType, CatalogItem[]>();
  for (const item of pool) {
    if (!item.featured) continue;
    const list = featuredByType.get(item.resourceType) ?? [];
    list.push(item);
    featuredByType.set(item.resourceType, list);
  }

  const result: CatalogItem[] = [];
  let addedThisRound = true;
  while (result.length < limit && addedThisRound) {
    addedThisRound = false;
    for (const list of featuredByType.values()) {
      if (list.length === 0) continue;
      result.push(list.shift() as CatalogItem);
      addedThisRound = true;
      if (result.length >= limit) break;
    }
  }

  return result;
}

export type GithubUpdatedWindow = "day" | "week" | "month" | "year";
export type GithubExplorerSort = "stars" | "updated" | "name";

export type GithubExplorerParams = {
  query?: string;
  languages?: string[];
  licenses?: string[];
  organizations?: string[];
  topics?: string[];
  minStars?: number;
  updatedWithin?: GithubUpdatedWindow;
  sort?: GithubExplorerSort;
  page?: number;
  pageSize?: number;
};

export type GithubExplorerFacets = {
  languages: string[];
  licenses: string[];
  organizations: string[];
  topics: string[];
};

export type GithubExplorerResult = {
  items: CatalogItem[];
  total: number;
  page: number;
  totalPages: number;
  facets: GithubExplorerFacets;
};

const UPDATED_WINDOW_MS: Record<GithubUpdatedWindow, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

const GITHUB_EXPLORER_DEFAULT_PAGE_SIZE = 12;

/**
 * GitHub Explorer's own dedicated filter/sort/pagination pass over the
 * live repo pool (`getCatalogItems({ resourceTypes: ["github-repo"] })`
 * only exposes the generic Type/Difficulty/Price filters shared with
 * every other catalog page - GitHub repos have no `difficulty`/`price`
 * that matters, they have language/license/organization/topics/stars/
 * last-updated instead). `facets` is always computed from the FULL,
 * unfiltered repo pool (not the filtered result) so a filter option never
 * silently disappears just because another filter is also active - same
 * principle as a real faceted search UI.
 */
export async function getGithubExplorerItems(params: GithubExplorerParams = {}): Promise<GithubExplorerResult> {
  const pool = await buildCatalogPool();
  const repos = pool.filter((item) => item.resourceType === "github-repo");

  const facets: GithubExplorerFacets = {
    languages: uniqueSorted(repos.map((r) => r.tag).filter((v): v is string => Boolean(v))),
    licenses: uniqueSorted(repos.map((r) => r.license).filter((v): v is string => Boolean(v))),
    organizations: uniqueSorted(repos.map((r) => r.owner).filter((v): v is string => Boolean(v))),
    topics: uniqueSorted(repos.flatMap((r) => r.topics ?? [])),
  };

  const pageSize = params.pageSize ?? GITHUB_EXPLORER_DEFAULT_PAGE_SIZE;
  const page = Math.max(1, params.page ?? 1);

  let filtered = repos;

  if (params.query) {
    const needle = params.query.trim().toLowerCase();
    if (needle) {
      filtered = filtered.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(needle));
    }
  }

  if (params.languages && params.languages.length > 0) {
    const set = new Set(params.languages);
    filtered = filtered.filter((item) => item.tag !== undefined && set.has(item.tag));
  }

  if (params.licenses && params.licenses.length > 0) {
    const set = new Set(params.licenses);
    filtered = filtered.filter((item) => item.license !== undefined && set.has(item.license));
  }

  if (params.organizations && params.organizations.length > 0) {
    const set = new Set(params.organizations);
    filtered = filtered.filter((item) => item.owner !== undefined && set.has(item.owner));
  }

  if (params.topics && params.topics.length > 0) {
    const set = new Set(params.topics);
    filtered = filtered.filter((item) => (item.topics ?? []).some((topic) => set.has(topic)));
  }

  if (params.minStars !== undefined) {
    filtered = filtered.filter((item) => (item.stars ?? 0) >= params.minStars!);
  }

  if (params.updatedWithin) {
    const windowMs = UPDATED_WINDOW_MS[params.updatedWithin];
    const cutoff = Date.now() - windowMs;
    filtered = filtered.filter((item) => item.updatedAtIso !== undefined && new Date(item.updatedAtIso).getTime() >= cutoff);
  }

  const sorted = [...filtered].sort((a, b) => {
    if (params.sort === "name") return a.title.localeCompare(b.title);
    if (params.sort === "updated") {
      return new Date(b.updatedAtIso ?? 0).getTime() - new Date(a.updatedAtIso ?? 0).getTime();
    }
    // "stars" (default): highest stars first.
    return (b.stars ?? 0) - (a.stars ?? 0);
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  return { items, total, page: clampedPage, totalPages, facets };
}

export type DeveloperHubStats = {
  certificationsCount: number;
  coursesCount: number;
  learningPathsCount: number;
  githubReposCount: number;
  developerToolsCount: number;
  roadmapsCount: number;
  cheatSheetsCount: number;
  releasesCount: number;
  /** Real count of curated items with `featured: true` across every static resource type, plus live GitHub repos over the same 50k-star bar `buildCatalogPool` uses to mark a repo `featured` - kept as a direct sum here (not a `buildCatalogPool()` call) so this function doesn't re-fetch GitHub a second time on top of the `githubRepos` it already fetches below. */
  featuredCount: number;
  lastUpdatedRelative: string;
};

/**
 * Every figure here is a real count - the curated arrays' own `.length`,
 * the live GitHub pool's current size, and a real database count of
 * `contentType: "release"` articles (reusing `getNewsExplorerArticles`
 * rather than a new query). No number is styled to look bigger than it
 * actually is (see `src/data/developer-hub.ts`'s doc comment).
 */
export async function getDeveloperHubStats(): Promise<DeveloperHubStats> {
  const [githubRepos, releasesPage] = await Promise.all([
    getTrendingGithubRepos(),
    getNewsExplorerArticles({ contentType: "release", page: 1, pageSize: 1 }),
  ]);

  const featuredCount =
    CERTIFICATIONS.filter((item) => item.featured).length +
    COURSES.filter((item) => item.featured).length +
    LEARNING_PATHS.filter((item) => item.featured).length +
    DEVELOPER_TOOLS.filter((item) => item.featured).length +
    ROADMAPS.filter((item) => item.featured).length +
    CHEAT_SHEETS.filter((item) => item.featured).length +
    githubRepos.filter((repo) => repo.stars > 50000).length;

  return {
    certificationsCount: CERTIFICATIONS.length,
    coursesCount: COURSES.length,
    learningPathsCount: LEARNING_PATHS.length,
    githubReposCount: githubRepos.length,
    developerToolsCount: DEVELOPER_TOOLS.length,
    roadmapsCount: ROADMAPS.length,
    cheatSheetsCount: CHEAT_SHEETS.length,
    releasesCount: releasesPage.total,
    featuredCount,
    lastUpdatedRelative: "Today",
  };
}
