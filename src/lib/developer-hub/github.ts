import { fetchWithTimeout } from "@/lib/news/fetch-with-timeout";
import { TTLCache } from "@/lib/news/ttl-cache";

/**
 * Developer Hub's "GitHub Explorer" / "Trending GitHub Repositories"
 * section - the one part of the catalog that CAN be real, live data
 * instead of a hand-curated snapshot, since GitHub's public REST API
 * needs no authentication for reading a repo's own stats. Rather than
 * trying to replicate GitHub's actual (rate-limited, not publicly
 * documented) trending algorithm, this curates a real, well-known list of
 * repositories (`TRACKED_REPOS`) and fetches each one's live star/fork
 * count, language and last-updated time directly from the GitHub API -
 * so the numbers on screen are always genuinely current, never a
 * fabricated snapshot.
 */

export type GithubRepo = {
  slug: string;
  fullName: string;
  description: string;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  url: string;
  /** Real SPDX license identifier/name from GitHub's own license detection (`repo.license`), e.g. "MIT". `null` when GitHub hasn't detected one. */
  license: string | null;
  /** Real repo topics as set by the maintainers on GitHub (`repo.topics`), e.g. `["react", "frontend"]`. Empty array when none are set. */
  topics: string[];
  /** Real repo creation date from GitHub (`repo.created_at`) - powers an honest "New" sort on the Open Source Explorer instead of a fabricated one. */
  createdAt: string;
};

/** Real, well-known repositories - a stand-in for "trending" since GitHub doesn't expose that ranking publicly. */
const TRACKED_REPOS = [
  "vercel/next.js",
  "microsoft/vscode",
  "facebook/react",
  "langchain-ai/langchain",
  "vercel/ai",
  "sveltejs/svelte",
  "nodejs/node",
  "tailwindlabs/tailwindcss",
  "denoland/deno",
  "oven-sh/bun",
  "vuejs/vue",
  "supabase/supabase",
];

type GithubApiRepo = {
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  html_url: string;
  license: { spdx_id: string | null; name: string } | null;
  topics?: string[];
};

const FETCH_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes - real data, but no need to hit GitHub on every request.

const repoCache = new TTLCache<GithubRepo[]>(CACHE_TTL_MS);

async function fetchRepo(fullName: string): Promise<GithubRepo | null> {
  try {
    const response = await fetchWithTimeout(
      `https://api.github.com/repos/${fullName}`,
      { headers: { Accept: "application/vnd.github+json" } },
      FETCH_TIMEOUT_MS
    );
    if (!response.ok) return null;

    const data = (await response.json()) as GithubApiRepo;
    const license = data.license
      ? data.license.spdx_id && data.license.spdx_id !== "NOASSERTION"
        ? data.license.spdx_id
        : data.license.name
      : null;
    return {
      slug: data.full_name,
      fullName: data.full_name,
      description: data.description ?? "",
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      updatedAt: data.updated_at,
      url: data.html_url,
      license,
      topics: data.topics ?? [],
      createdAt: data.created_at,
    };
  } catch {
    // A single repo failing to fetch (rate limit, network hiccup) should
    // never take the whole section down - it's just omitted this time.
    return null;
  }
}

/**
 * Returns live GitHub repo data for `TRACKED_REPOS`, cached for
 * `CACHE_TTL_MS` to stay well under GitHub's unauthenticated rate limit
 * (60 requests/hour). Falls back to the last-known-good cached value on
 * a fetch failure (`peek()`) rather than showing nothing, and only
 * returns `[]` if there has never been a successful fetch at all.
 */
export async function getTrendingGithubRepos(): Promise<GithubRepo[]> {
  const cached = repoCache.get();
  if (cached) return cached;

  const results = await Promise.all(TRACKED_REPOS.map((fullName) => fetchRepo(fullName)));
  const repos = results.filter((repo): repo is GithubRepo => repo !== null);

  if (repos.length > 0) {
    repoCache.set(repos);
    return repos;
  }

  // Every fetch failed this round (e.g. rate-limited) - serve the last
  // good snapshot instead of an empty section, if one exists.
  return repoCache.peek() ?? [];
}
