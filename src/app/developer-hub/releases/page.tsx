import { ExplorerView } from "@/components/explorer/ExplorerView";
import type { ExplorerSearchParams } from "@/lib/news-explorer/shared";

export const metadata = {
  title: "Releases | Developer Hub | VIREXA",
  description: "Real, database-backed release and version-update articles.",
};

type PageProps = { searchParams: Promise<ExplorerSearchParams> };

/**
 * Unlike every other Developer Hub sub-page (which renders
 * `CatalogExplorerView` over the curated static/live catalog - see
 * `developer-hub-service.ts`), Releases are real articles already
 * ingested into the database and classified as `contentType: "release"`
 * (see `classifyContentType`). Rather than duplicating that into the
 * catalog pool, this reuses the unified News Explorer directly - same
 * component `/open-source` and `/cloud` already reuse for their own
 * locked defaults.
 */
export default async function DeveloperHubReleasesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <ExplorerView
      title="Releases"
      subtitle="Real release and version-update articles collected by VIREXA."
      basePath="/developer-hub/releases"
      searchParams={params}
      defaultContentType="release"
    />
  );
}
