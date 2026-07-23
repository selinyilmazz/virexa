import { CatalogExplorerView } from "@/components/developer-hub/CatalogExplorerView";
import type { DeveloperHubSearchParams } from "@/lib/developer-hub/shared";

// Stabilization pass: same force-dynamic reasoning as `/developer-hub/page.tsx`.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Certifications | Developer Hub | VIREXA",
  description: "Industry-recognized developer and cloud certifications, curated.",
};

type PageProps = { searchParams: Promise<DeveloperHubSearchParams> };

export default async function CertificationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <CatalogExplorerView
      title="Certifications"
      subtitle="Industry-recognized certifications from AWS, Microsoft, Google Cloud, HashiCorp, GitHub and more."
      basePath="/developer-hub/certifications"
      searchParams={params}
      defaultResourceType="certification"
    />
  );
}
