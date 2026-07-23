import Link from "next/link";
import { REPOSITORY_CATEGORY_LABELS, REPOSITORY_CATEGORY_ORDER } from "@/lib/developer-hub/shared";
import type { GithubFeaturedCollection } from "@/services/developer-hub/github-explorer-service";
import type { CollectionRow } from "@/types/database";

type GithubFeaturedCollectionsProps = {
  categories: GithubFeaturedCollection[];
  namedCollections: (CollectionRow & { repoCount: number })[];
  activeCategory?: string;
};

/**
 * "Featured Collections" section - the fixed 9-category quick-filter
 * grid (`repositories.category`, 0024) plus any admin-curated named
 * collections underneath (`collections`/`collection_repositories`, same
 * migration). Deliberately two distinct groups, not merged into one grid
 * - the category taxonomy is fixed and always shows all 9 (even at 0
 * repos, so the grid never reflows), while named collections are
 * arbitrary, admin-authored, and only appear once an admin creates one.
 * Every count here is real (`getFeaturedCategoryCollections`/
 * `getVisibleCollections`), never fabricated.
 */
export function GithubFeaturedCollections({ categories, namedCollections, activeCategory }: GithubFeaturedCollectionsProps) {
  const byCategory = new Map(categories.map((c) => [c.categorySlug, c.repoCount]));

  return (
    <section id="featured-collections" className="scroll-mt-28">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-slate-950">Featured Collections</h2>
        <p className="text-sm text-slate-500">Jump straight to the category you care about</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
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

      {namedCollections.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {namedCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/developer-hub/github?collection=${collection.slug}`}
              scroll={false}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                {collection.icon || "📁"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">{collection.name}</p>
                <p className="text-xs text-slate-500">{collection.repoCount.toLocaleString("en-US")} repositories</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
