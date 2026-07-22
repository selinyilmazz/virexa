import { GithubExplorerView } from "@/components/developer-hub/GithubExplorerView";
import type { GithubExplorerSearchParams } from "@/lib/developer-hub/shared";

export const metadata = {
  title: "GitHub Explorer | Developer Hub | VIREXA",
  description: "Live star, fork and language data for well-known open source repositories.",
};

type PageProps = { searchParams: Promise<GithubExplorerSearchParams> };

/**
 * Live GitHub data (see `getTrendingGithubRepos`), not a static snapshot
 * - stars/forks/last-updated are real, current numbers pulled from the
 * GitHub API at request time (subject to a short cache - see that
 * function's doc comment). Renders through the dedicated
 * `GithubExplorerView` (Language/License/Stars/Updated/Topics/
 * Organization filters + richer repo cards) rather than the generic
 * `CatalogExplorerView` every other Developer Hub sub-page uses - see
 * that component's doc comment for why.
 */
export default async function GithubExplorerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <GithubExplorerView searchParams={params} />;
}
