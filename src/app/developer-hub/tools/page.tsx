import { CatalogExplorerView } from "@/components/developer-hub/CatalogExplorerView";
import type { DeveloperHubSearchParams } from "@/lib/developer-hub/shared";
import { getServerTranslations } from "@/i18n/get-server-translations";

// Stabilization pass: same force-dynamic reasoning as `/developer-hub/page.tsx`.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Developer Tools | Developer Hub | VIREXA",
  description: "Essential, free developer tools every engineer should know.",
};

type PageProps = { searchParams: Promise<DeveloperHubSearchParams> };

export default async function DeveloperToolsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t } = await getServerTranslations();
  return (
    <CatalogExplorerView
      title={t("developerHub.pages.tools.title")}
      subtitle={t("developerHub.pages.tools.subtitle")}
      basePath="/developer-hub/tools"
      searchParams={params}
      defaultResourceType="developer-tool"
    />
  );
}
