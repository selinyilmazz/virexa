import { CatalogExplorerView } from "@/components/developer-hub/CatalogExplorerView";
import type { DeveloperHubSearchParams } from "@/lib/developer-hub/shared";
import { getServerTranslations } from "@/i18n/get-server-translations";

// Stabilization pass: same force-dynamic reasoning as `/developer-hub/page.tsx`.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Courses | Developer Hub | VIREXA",
  description: "Online courses and professional certificates from top learning platforms.",
};

type PageProps = { searchParams: Promise<DeveloperHubSearchParams> };

export default async function CoursesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t } = await getServerTranslations();
  return (
    <CatalogExplorerView
      title={t("developerHub.pages.courses.title")}
      subtitle={t("developerHub.pages.courses.subtitle")}
      basePath="/developer-hub/courses"
      searchParams={params}
      defaultResourceType="course"
    />
  );
}
