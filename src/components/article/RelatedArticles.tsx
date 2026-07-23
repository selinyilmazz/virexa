import Link from "next/link";
import { RelatedArticleCard } from "@/components/article/RelatedArticleCard";
import type { RelatedArticleItem } from "@/data/article";

type RelatedArticlesProps = {
  items: RelatedArticleItem[];
  viewAllHref: string;
};

export function RelatedArticles({ items, viewAllHref }: RelatedArticlesProps) {
  return (
    <section
      aria-labelledby="related-articles-title"
      className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 id="related-articles-title" className="text-3xl font-bold tracking-tight text-slate-950">
        Related Articles
      </h2>

      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.slug}>
            <RelatedArticleCard article={item} />
          </li>
        ))}
      </ul>

      <Link
        href={viewAllHref}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
      >
        View all related →
      </Link>
    </section>
  );
}
