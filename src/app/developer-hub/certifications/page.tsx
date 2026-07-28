import { CatalogExplorerView } from "@/components/developer-hub/CatalogExplorerView";
import type { DeveloperHubSearchParams } from "@/lib/developer-hub/shared";
import { getServerTranslations } from "@/i18n/get-server-translations";

// Stabilization pass: same force-dynamic reasoning as `/developer-hub/page.tsx`.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Certifications | Developer Hub | VIREXA",
  description: "Industry-recognized developer and cloud certifications, curated.",
};

type PageProps = { searchParams: Promise<DeveloperHubSearchParams> };

export default async function CertificationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t } = await getServerTranslations();
  return (
    <CatalogExplorerView
      title={t("developerHub.pages.certifications.title")}
      subtitle={t("developerHub.pages.certifications.subtitle")}
      basePath="/developer-hub/certifications"
      searchParams={params}
      defaultResourceType="certification"
    />
  );
}
