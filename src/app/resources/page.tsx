import { ExplorerView } from "@/components/explorer/ExplorerView";
import type { ExplorerSearchParams } from "@/lib/news-explorer/shared";

export const metadata = {
  title: "Developer Resources | VIREXA",
  description: "Developer certifications, official learning resources and free opportunities.",
};

type ResourcesPageProps = {
  searchParams: Promise<ExplorerSearchParams>;
};

/**
 * Developer Resources - the unified Explorer restricted to real
 * articles matching the "Developer Resources" watch-list
 * (`RESOURCE_SEARCH_TERMS` - certification/certified/free license/free
 * course/scholarship/learning path/bootcamp, the exact same terms the
 * homepage's "Developer Resources" widget already searches for). See
 * `getNewsExplorerArticles`'s `resourcesOnly` doc comment for how this
 * pool is built.
 */
export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const params = await searchParams;

  return (
    <ExplorerView
      title="Developer Resources"
      subtitle="Developer certifications, official learning resources and free opportunities."
      basePath="/resources"
      searchParams={params}
      resourcesOnly
    />
  );
}
