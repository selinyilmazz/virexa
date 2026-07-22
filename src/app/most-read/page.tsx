import type { Metadata } from "next";
import { ExplorerView } from "@/components/explorer/ExplorerView";
import type { ExplorerSearchParams } from "@/lib/news-explorer/shared";

export const metadata: Metadata = {
  title: "Most Read | Virexa",
  description: "The most-read articles on Virexa, ranked by real reader engagement.",
};

type MostReadPageProps = {
  searchParams: Promise<ExplorerSearchParams>;
};

/**
 * Most Read - View All. Used to be a bespoke page (plain `NewsCard` list
 * + the old `category/Pagination` component, no filters, no sidebar, no
 * stats strip - see git history). Per the unified-Explorer design system
 * ("every listing page uses the exact same structure"), this is now just
 * `ExplorerView` with `defaultSort="most-read"` - the unified Explorer
 * already has a real `most-read` sort (ranked by `trending_score`, the
 * same metric the old bespoke page used - see
 * `getNewsExplorerArticles`'s doc comment), so nothing new had to be
 * built to wire this in. The default only takes effect until the visitor
 * picks a different Sort option themselves, exactly like every other
 * `default*` prop on `ExplorerView`.
 */
export default async function MostReadPage({ searchParams }: MostReadPageProps) {
  const params = await searchParams;

  return (
    <ExplorerView
      title="Most Read"
      subtitle="The most-read articles on Virexa, ranked by real reader engagement."
      basePath="/most-read"
      searchParams={params}
      defaultSort="most-read"
      pulseTopic="general"
    />
  );
}
