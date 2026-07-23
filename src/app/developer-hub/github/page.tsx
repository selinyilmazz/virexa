import { GithubExplorerView } from "@/components/developer-hub/GithubExplorerView";
import type { GithubLibrarySearchParams } from "@/lib/developer-hub/shared";

// Stabilization pass: same force-dynamic reasoning as `/developer-hub/page.tsx`.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "GitHub Explorer | Developer Knowledge Library | VIREXA",
  description: "A curated library of repositories every developer should know about - AI agents, developer productivity, system design, security, mobile, and more.",
};

type PageProps = { searchParams: Promise<GithubLibrarySearchParams> };

/**
 * The "Developer Knowledge Library" GitHub Explorer redesign - a
 * hand-curated, admin-managed catalog of repositories (real
 * `repositories` table data via `github-explorer-service.ts`), not a
 * GitHub Trending clone. See `GithubExplorerView`'s doc comment for the
 * full section breakdown (Hero / Featured Collections / Quick Stats /
 * Filters+Sort+Results+Pagination).
 */
export default async function GithubExplorerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <GithubExplorerView searchParams={params} />;
}
