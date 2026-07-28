import { CatalogExplorerView } from "@/components/developer-hub/CatalogExplorerView";
import type { DeveloperHubSearchParams } from "@/lib/developer-hub/shared";
import { getServerTranslations } from "@/i18n/get-server-translations";

// Stabilization pass: same force-dynamic reasoning as `/developer-hub/page.tsx`.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Learning Paths | Developer Hub | VIREXA",
  description: "Structured, official learning paths across cloud platforms and web development.",
};

type PageProps = { searchParams: Promise<DeveloperHubSearchParams> };

export default async function LearningPathsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t } = await getServerTranslations();
  return (
    <CatalogExplorerView
      title={t("developerHub.pages.learningPaths.title")}
      subtitle={t("developerHub.pages.learningPaths.subtitle")}
      basePath="/developer-hub/learning-paths"
      searchParams={params}
      defaultResourceType="learning-path"
    />
  );
}
