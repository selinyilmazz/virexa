import { getAdminArticlesPage } from "@/services/admin/admin-article-service";
import { getAdminSourcesList } from "@/services/admin/admin-source-service";
import { getAdminUsersPage } from "@/services/admin/admin-user-service";
import { getAdminRepositoriesList } from "@/services/admin/admin-repository-service";
import { getAdminReleasesList } from "@/services/admin/admin-release-service";

/**
 * Global admin search (requirement 14) - deliberately reuses each
 * section's EXISTING read service (`getAdminArticlesPage`,
 * `getAdminSourcesList`, `getAdminUsersPage`, `getAdminRepositoriesList`,
 * `getAdminReleasesList`) instead of writing new one-off queries, per
 * "Reuse existing services... Do not create duplicate logic." All 5
 * admin sections are now wired in.
 */

export type AdminSearchResultType = "article" | "user" | "source" | "repository" | "release";

export type AdminSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type AdminSearchResults = Record<AdminSearchResultType, AdminSearchResult[]>;

const RESULTS_PER_TYPE = 8;

function emptyResults(): AdminSearchResults {
  return { article: [], user: [], source: [], repository: [], release: [] };
}

export async function searchAdmin(query: string): Promise<AdminSearchResults> {
  const trimmed = query.trim();
  if (!trimmed) return emptyResults();

  try {
    const [articlesPage, sources, usersPage, repositories, releases] = await Promise.all([
      getAdminArticlesPage({ search: trimmed }, 1, RESULTS_PER_TYPE),
      getAdminSourcesList(),
      getAdminUsersPage({ search: trimmed }, 1, RESULTS_PER_TYPE),
      getAdminRepositoriesList(),
      getAdminReleasesList(),
    ]);

    const lowerQuery = trimmed.toLowerCase();
    const matchingSources = sources
      .filter((source) => source.name.toLowerCase().includes(lowerQuery))
      .slice(0, RESULTS_PER_TYPE);
    const matchingRepositories = repositories
      .filter((repo) => `${repo.id} ${repo.description}`.toLowerCase().includes(lowerQuery))
      .slice(0, RESULTS_PER_TYPE);
    const matchingReleases = releases
      .filter((release) => `${release.product} ${release.slug}`.toLowerCase().includes(lowerQuery))
      .slice(0, RESULTS_PER_TYPE);

    return {
      article: articlesPage.items.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: `${item.sourceName} · ${item.category}`,
        href: `/admin/articles?selected=${item.id}`,
      })),
      user: usersPage.items.map((item) => ({
        id: item.id,
        title: item.displayName,
        subtitle: item.email,
        href: `/admin/users?q=${encodeURIComponent(item.email)}`,
      })),
      source: matchingSources.map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: `${item.totalArticles.toLocaleString()} articles`,
        href: "/admin/sources",
      })),
      repository: matchingRepositories.map((item) => ({
        id: item.id,
        title: item.id,
        subtitle: `${item.stars.toLocaleString()} stars · ${item.language ?? "Unknown"}`,
        href: `/admin/repositories?edit=${encodeURIComponent(item.id)}`,
      })),
      release: matchingReleases.map((item) => ({
        id: item.id,
        title: `${item.product} ${item.version}`,
        subtitle: item.channel.toUpperCase(),
        href: `/admin/releases?edit=${item.id}`,
      })),
    };
  } catch (error) {
    console.error("[admin-search-service] searchAdmin failed:", error);
    return emptyResults();
  }
}
