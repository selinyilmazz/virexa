import { RelatedCategories } from "@/components/category/RelatedCategories";
import type { RelatedCategoryItem } from "@/components/category/RelatedCategories";
import { TopSources } from "@/components/category/TopSources";
import { SidebarMiniCard } from "@/components/shared/SidebarMiniCard";
import type { CategoryNewsItem } from "@/data/categories";
import type { TopSourceStat } from "@/services/articles/article-read-service";

type CategorySidebarProps = {
  topSources: TopSourceStat[];
  relatedCategories: RelatedCategoryItem[];
  recentNews: CategoryNewsItem[];
};

/**
 * Category sidebar, redesigned around navigation/discovery (product
 * polishing phase, area 8) instead of the old Popular Tags (static,
 * non-clickable pills) + a plain-text "Recently Added" list (no links,
 * no thumbnails). Top Sources and Related Categories are both real
 * paths to more content; Recently Added now uses `SidebarMiniCard` so
 * every row is a genuinely clickable, thumbnail-bearing feed item.
 */
export function CategorySidebar({ topSources, relatedCategories, recentNews }: CategorySidebarProps) {
  return (
    <div className="space-y-6 xl:sticky xl:top-28">
      <TopSources sources={topSources} />
      <RelatedCategories categories={relatedCategories} />

      {recentNews.length > 0 && (
        <section
          aria-labelledby="recent-news-title"
          className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 id="recent-news-title" className="text-xl font-bold tracking-tight text-slate-950">
            Recently Added
          </h2>

          <div className="mt-3 space-y-1">
            {recentNews.map((item) => (
              <SidebarMiniCard
                key={item.slug}
                slug={item.slug}
                image={item.image}
                category={item.category}
                title={item.title}
                source={item.source}
                publishedDate={item.publishedDate}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
