import { CatalogExplorerView } from "@/components/developer-hub/CatalogExplorerView";
import type { DeveloperHubSearchParams } from "@/lib/developer-hub/shared";

export const metadata = {
  title: "Learning Paths | Developer Hub | VIREXA",
  description: "Structured, official learning paths across cloud platforms and web development.",
};

type PageProps = { searchParams: Promise<DeveloperHubSearchParams> };

export default async function LearningPathsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <CatalogExplorerView
      title="Learning Paths"
      subtitle="Official, structured learning paths from Microsoft Learn, Google Cloud, AWS and MDN Web Docs."
      basePath="/developer-hub/learning-paths"
      searchParams={params}
      defaultResourceType="learning-path"
    />
  );
}
