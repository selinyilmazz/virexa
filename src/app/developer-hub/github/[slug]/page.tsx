import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { GithubRepoDetailView } from "@/components/developer-hub/GithubRepoDetailView";
import { fetchReadmeExcerpt, fetchRecentReleases } from "@/lib/developer-hub/github";
import {
  getAlternativeRepositories,
  getCollectionsForRepository,
  getGithubRepoBySlug,
  getGithubSidebarWidgets,
  getRelatedRepositories,
  getYouMayAlsoLike,
} from "@/services/developer-hub/github-explorer-service";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const repo = await getGithubRepoBySlug(slug);
  if (!repo) return { title: "Repository Not Found | Developer Hub | VIREXA" };
  return {
    title: `${repo.owner}/${repo.repoName} | GitHub Explorer | VIREXA`,
    description: repo.description || `${repo.owner}/${repo.repoName} on Virexa's Developer Knowledge Library.`,
  };
}

/**
 * Repository Detail page - the "Developer Knowledge Library" GitHub
 * Explorer redesign's dedicated per-repo page. Real, admin-curated
 * `repositories` table data (`getGithubRepoBySlug`) plus live GitHub
 * README/release data fetched on demand (not cached at this layer -
 * detail pages are lower-traffic than the list page, and GitHub's raw
 * README/releases endpoints already respond quickly). A hidden, archived,
 * or nonexistent slug renders a real 404 via `notFound()` rather than a
 * silently-empty page - see `getGithubRepoBySlug`'s doc comment.
 */
export default async function GithubRepoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const repo = await getGithubRepoBySlug(slug);
  if (!repo) notFound();

  const [readmeExcerpt, releases, related, collections, sidebarWidgets] = await Promise.all([
    fetchReadmeExcerpt(repo.fullName),
    fetchRecentReleases(repo.fullName),
    getRelatedRepositories(repo, 6),
    getCollectionsForRepository(repo.id),
    getGithubSidebarWidgets(repo.id, 5),
  ]);

  const alternatives = await getAlternativeRepositories(repo, 4);
  const youMayAlsoLike = await getYouMayAlsoLike(
    [repo.id, ...related.map((r) => r.id), ...alternatives.map((r) => r.id)],
    6
  );

  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <GithubRepoDetailView
          repo={repo}
          readmeExcerpt={readmeExcerpt}
          releases={releases}
          related={related}
          alternatives={alternatives}
          collections={collections}
          sidebarWidgets={sidebarWidgets}
          youMayAlsoLike={youMayAlsoLike}
        />
      </main>
    </>
  );
}
