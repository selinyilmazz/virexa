import { SEARCH_CATEGORY_SLUGS } from "@/lib/news";
import { getTopSources } from "@/services/articles/article-read-service";
import { NewsExplorerFiltersPanel } from "@/components/news-explorer/NewsExplorerFiltersPanel";

type NewsExplorerFiltersProps = {
  time?: string;
  categories?: string;
  sources?: string;
  type?: string;
};

/**
 * Server wrapper for the News Explorer sidebar - fetches the real,
 * currently-most-active sources (`getTopSources`) once per render, then
 * hands both that list and the site's real 12-category taxonomy
 * (`SEARCH_CATEGORY_SLUGS` - the same canonical list `/search`'s
 * Category filter uses) down to the (instant-apply, no staged state)
 * client panel.
 */
export async function NewsExplorerFilters({ time, categories, sources, type }: NewsExplorerFiltersProps) {
  const topSources = await getTopSources(12);

  return (
    <NewsExplorerFiltersPanel
      time={time}
      categories={categories ? categories.split(",").filter(Boolean) : []}
      sources={sources ? sources.split(",").filter(Boolean) : []}
      type={type}
      categoryOptions={SEARCH_CATEGORY_SLUGS.map((category) => ({ slug: category.slug, name: category.name }))}
      sourceOptions={topSources}
    />
  );
}
