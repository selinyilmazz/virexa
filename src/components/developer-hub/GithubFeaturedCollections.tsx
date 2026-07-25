import Link from "next/link";
import { REPOSITORY_CATEGORY_LABELS, REPOSITORY_CATEGORY_ORDER } from "@/lib/developer-hub/shared";
import type { GithubFeaturedCollection } from "@/services/developer-hub/github-explorer-service";

type GithubFeaturedCollectionsProps = {
  categories: GithubFeaturedCollection[];
  activeCategory?: string;
};

/**
 * "Featured Collections" - the ONE collection-navigation surface on the
 * page: the fixed category quick-filter grid (`repositories.category`,
 * 0024/0026). Admin-curated named collections (`collections`/
 * `collection_repositories`) are deliberately NOT duplicated here - they
 * live exclusively in the sidebar's "Collection" filter
 * (`GithubLibraryFiltersPanel`), so there is never more than one
 * collection-browsing UI on the page (simplification pass: the page
 * previously rendered a second "named collections" grid directly below
 * this one, which duplicated that same functionality).
 *
 * `activeCategory` and every card's href both read/write the same
 * `?category=` URL param the sidebar's Category filter uses - that one
 * shared param is the single source of truth, so clicking a card here
 * and toggling the sidebar radio always agree on what's active (see
 * `GithubLibraryFiltersPanel.tsx`). Every count here is real
 * (`getFeaturedCategoryCollections`), never fabricated.
 */
export function GithubFeaturedCollections({ categories, activeCategory }: GithubFeaturedCollectionsProps) {
  const byCategory = new Map(categories.map((c) => [c.categorySlug, c.repoCount]));

  return (
    <section id="featured-collections" className="scroll-mt-28">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-slate-950">Featured Collections</h2>
        <p className="text-sm text-slate-500">Jump straight to the category you care about</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {REPOSITORY_CATEGORY_ORDER.map((slug) => {
          const meta = REPOSITORY_CATEGORY_LABELS[slug];
          const count = byCategory.get(slug) ?? 0;
          const isActive = activeCategory === slug;
          return (
            <Link
              key={slug}
              href={isActive ? "/developer-hub/github" : `/developer-hub/github?category=${slug}`}
              scroll={false}
              className={`group flex flex-col items-center gap-2 rounded-2xl border p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                isActive ? "border-[#2f67e8] bg-[#2f67e8]/5" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span aria-hidden="true" className="text-2xl">
                {meta.emoji}
              </span>
              <span className="text-xs font-semibold leading-tight text-slate-900">{meta.label}</span>
              <span className="text-[11px] font-medium text-slate-500">{count.toLocaleString("en-US")} repos</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
