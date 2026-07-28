import { CatalogExplorerView } from "@/components/developer-hub/CatalogExplorerView";
import type { DeveloperHubSearchParams } from "@/lib/developer-hub/shared";
import { getServerTranslations } from "@/i18n/get-server-translations";

// Stabilization pass: same force-dynamic reasoning as `/developer-hub/page.tsx`.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Roadmaps | Developer Hub | VIREXA",
  description: "Step-by-step roadmaps to becoming a frontend, backend, DevOps, AI or cloud engineer.",
};

type PageProps = { searchParams: Promise<DeveloperHubSearchParams> };

export default async function RoadmapsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t } = await getServerTranslations();
  return (
    <CatalogExplorerView
      title={t("developerHub.pages.roadmaps.title")}
      subtitle={t("developerHub.pages.roadmaps.subtitle")}
      basePath="/developer-hub/roadmaps"
      searchParams={params}
      defaultResourceType="roadmap"
    />
  );
}
