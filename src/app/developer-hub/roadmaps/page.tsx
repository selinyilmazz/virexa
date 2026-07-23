import { CatalogExplorerView } from "@/components/developer-hub/CatalogExplorerView";
import type { DeveloperHubSearchParams } from "@/lib/developer-hub/shared";

// Stabilization pass: same force-dynamic reasoning as `/developer-hub/page.tsx`.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Roadmaps | Developer Hub | VIREXA",
  description: "Step-by-step roadmaps to becoming a frontend, backend, DevOps, AI or cloud engineer.",
};

type PageProps = { searchParams: Promise<DeveloperHubSearchParams> };

export default async function RoadmapsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <CatalogExplorerView
      title="Roadmaps"
      subtitle="Step-by-step guides to becoming a frontend, backend, DevOps, AI or cloud engineer, from roadmap.sh."
      basePath="/developer-hub/roadmaps"
      searchParams={params}
      defaultResourceType="roadmap"
    />
  );
}
