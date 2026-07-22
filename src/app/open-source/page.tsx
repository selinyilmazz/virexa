import { ExplorerView } from "@/components/explorer/ExplorerView";
import type { ExplorerSearchParams } from "@/lib/news-explorer/shared";

export const metadata = {
  title: "Open Source | VIREXA",
  description: "Latest open source projects, GitHub repositories and community updates.",
};

type OpenSourcePageProps = {
  searchParams: Promise<ExplorerSearchParams>;
};

/**
 * Open Source - the unified Explorer with a locked default Content Type
 * instead of a category. "Open Source" isn't one of the real DB
 * categories, but it IS already one of the 7 real, heuristically-
 * classified Content Type values every article gets (`classifyContentType`
 * in `article-read-service.ts`), so this page can pre-select a REAL
 * filter value here (unlike Cloud, which has no equivalent and falls
 * back to a locked search query instead).
 */
export default async function OpenSourcePage({ searchParams }: OpenSourcePageProps) {
  const params = await searchParams;

  return (
    <ExplorerView
      title="Open Source"
      subtitle="Latest open source projects, GitHub repositories and community updates."
      basePath="/open-source"
      searchParams={params}
      defaultContentType="open-source"
      pulseTopic="open-source"
    />
  );
}
