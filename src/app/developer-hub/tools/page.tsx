import { CatalogExplorerView } from "@/components/developer-hub/CatalogExplorerView";
import type { DeveloperHubSearchParams } from "@/lib/developer-hub/shared";

export const metadata = {
  title: "Developer Tools | Developer Hub | VIREXA",
  description: "Essential, free developer tools every engineer should know.",
};

type PageProps = { searchParams: Promise<DeveloperHubSearchParams> };

export default async function DeveloperToolsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <CatalogExplorerView
      title="Developer Tools"
      subtitle="Essential, free tools for everyday development - editors, API clients, terminals and more."
      basePath="/developer-hub/tools"
      searchParams={params}
      defaultResourceType="developer-tool"
    />
  );
}
