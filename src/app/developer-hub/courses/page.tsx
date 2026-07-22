import { CatalogExplorerView } from "@/components/developer-hub/CatalogExplorerView";
import type { DeveloperHubSearchParams } from "@/lib/developer-hub/shared";

export const metadata = {
  title: "Courses | Developer Hub | VIREXA",
  description: "Online courses and professional certificates from top learning platforms.",
};

type PageProps = { searchParams: Promise<DeveloperHubSearchParams> };

export default async function CoursesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <CatalogExplorerView
      title="Courses"
      subtitle="Structured courses from freeCodeCamp, Coursera, AWS Skill Builder, Microsoft Learn and edX."
      basePath="/developer-hub/courses"
      searchParams={params}
      defaultResourceType="course"
    />
  );
}
