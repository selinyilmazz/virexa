import Link from "next/link";
import { findCategoryHref } from "@/data/article";
import { getServerTranslations } from "@/i18n/get-server-translations";

export type RelatedCategoryItem = {
  name: string;
  icon: string;
  count: number;
};

type RelatedCategoriesProps = {
  categories: RelatedCategoryItem[];
};

/**
 * Cross-category discovery widget for the category sidebar (product
 * polishing phase, area 8). Reuses `getTrendingCategories`'s existing
 * per-category counts (the category page filters out the current
 * category and passes the rest through) instead of a new query - "which
 * other categories are actually active right now" is exactly what that
 * data already answers.
 */
export async function RelatedCategories({ categories }: RelatedCategoriesProps) {
  if (categories.length === 0) return null;
  const { t } = await getServerTranslations();

  return (
    <section
      aria-labelledby="related-categories-title"
      className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 id="related-categories-title" className="text-xl font-bold tracking-tight text-slate-950">
        {t("category.sidebar.relatedCategoriesTitle")}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{t("category.sidebar.relatedCategoriesSubtitle")}</p>

      <ul className="mt-4 grid grid-cols-2 gap-2">
        {categories.map((category) => (
          <li key={category.name}>
            <Link
              href={findCategoryHref(category.name)}
              className="group flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:border-slate-200 hover:bg-slate-50"
            >
              <span className="text-base" aria-hidden="true">
                {category.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800 group-hover:text-slate-700">
                  {category.name}
                </span>
                <span className="block text-xs text-slate-400">{t("category.sidebar.articlesCount", { count: category.count })}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
