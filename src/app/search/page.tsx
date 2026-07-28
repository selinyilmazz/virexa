import { ExplorerView } from "@/components/explorer/ExplorerView";
import type { ExplorerSearchParams } from "@/lib/news-explorer/shared";
import { getServerTranslations } from "@/i18n/get-server-translations";

export const metadata = {
  title: "Search Results | VIREXA",
  description: "Search every article collected by VIREXA.",
};

type SearchPageProps = {
  searchParams: Promise<ExplorerSearchParams>;
};

/**
 * Search Results - the unified Explorer with a query-driven title
 * instead of a bespoke search UI (the old `SearchHeader`/`SearchFilters`/
 * `SearchResults`/`SearchSidebar` stack is no longer rendered here - see
 * the unified-Explorer design: one template, everywhere). The query
 * itself needs no special handling beyond what `ExplorerView` already
 * does for every other page - `q` flows straight through like any other
 * filter param, and the header's search box already shows it (see
 * `Header`'s `initialSearchQuery`). This is the ONLY page that passes
 * `explainMatches` - it turns on the "Matched "X" • Found in Y" badge and
 * keyword highlighting (`NewsExplorerCard`'s `highlightQuery`), so match
 * explanations only ever appear here, never on `/news` or category pages.
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const { t } = await getServerTranslations();

  return (
    <ExplorerView
      title={t("explorer.search.title")}
      subtitle={
        query ? (
          <>
            {t("explorer.search.resultsFor")}
            <br />
            <span className="font-semibold text-slate-950">&quot;{query}&quot;</span>
          </>
        ) : (
          t("explorer.search.emptyPrompt")
        )
      }
      basePath="/search"
      searchParams={params}
      explainMatches
    />
  );
}
