import { ExplorerView } from "@/components/explorer/ExplorerView";
import type { ExplorerSearchParams } from "@/lib/news-explorer/shared";
import { getServerTranslations } from "@/i18n/get-server-translations";

export const metadata = {
  title: "News Explorer | VIREXA",
  description: "Browse every article collected by VIREXA. Newest articles appear first.",
};

type NewsExplorerPageProps = {
  searchParams: Promise<ExplorerSearchParams>;
};

/**
 * View All News - the unified Explorer's own "no filters pre-applied"
 * baseline (every other Explorer route is this exact same page, just
 * with a different title/subtitle and a default filter or two - see
 * `ExplorerView`'s doc comment).
 */
export default async function NewsExplorerPage({ searchParams }: NewsExplorerPageProps) {
  const params = await searchParams;
  const { t } = await getServerTranslations();

  return (
    <ExplorerView
      title={t("explorer.pages.news.title")}
      subtitle={t("explorer.pages.news.subtitle")}
      basePath="/news"
      searchParams={params}
    />
  );
}
