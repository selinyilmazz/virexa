import { CatalogExplorerView } from "@/components/developer-hub/CatalogExplorerView";
import type { DeveloperHubSearchParams } from "@/lib/developer-hub/shared";
import { getServerTranslations } from "@/i18n/get-server-translations";

// Stabilization pass: same force-dynamic reasoning as `/developer-hub/page.tsx`.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cheat Sheets | Developer Hub | VIREXA",
  description: "Quick-reference cheat sheets for Git, Docker, Kubernetes, Bash, regex, Python and SQL.",
};

type PageProps = { searchParams: Promise<DeveloperHubSearchParams> };

export default async function CheatSheetsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t } = await getServerTranslations();
  return (
    <CatalogExplorerView
      title={t("developerHub.pages.cheatSheets.title")}
      subtitle={t("developerHub.pages.cheatSheets.subtitle")}
      basePath="/developer-hub/cheat-sheets"
      searchParams={params}
      defaultResourceType="cheat-sheet"
    />
  );
}
