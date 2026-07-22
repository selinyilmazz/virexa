import { ExplorerView } from "@/components/explorer/ExplorerView";
import type { ExplorerSearchParams } from "@/lib/news-explorer/shared";

export const metadata = {
  title: "Cloud | VIREXA",
  description: "Cloud infrastructure, Kubernetes, AWS, Azure, GCP and DevOps news.",
};

type CloudPageProps = {
  searchParams: Promise<ExplorerSearchParams>;
};

/**
 * Cloud - the unified Explorer with a locked default search query
 * instead of a category filter. "Cloud" isn't one of the site's real DB
 * categories (`data/categories.ts`'s 12-category taxonomy has no such
 * entry), so pre-checking a Categories-sidebar box the way `/category/
 * ai`/`/category/programming`/`/category/security` do would mean
 * inventing a category that doesn't exist. `defaultQuery="cloud"`
 * instead scopes this page to real matching articles the honest way -
 * the same real full-text search every other query already runs through
 * - and the header's search box reflects it automatically (see
 * `ExplorerView`'s `Header initialSearchQuery` wiring).
 */
export default async function CloudPage({ searchParams }: CloudPageProps) {
  const params = await searchParams;

  return (
    <ExplorerView
      title="Cloud"
      subtitle="Cloud infrastructure, Kubernetes, AWS, Azure, GCP and DevOps news."
      basePath="/cloud"
      searchParams={params}
      defaultQuery="cloud"
      pulseTopic="cloud"
    />
  );
}
