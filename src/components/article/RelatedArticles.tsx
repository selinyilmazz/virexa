import Link from "next/link";
import { RelatedArticleCard } from "@/components/article/RelatedArticleCard";
import type { RelatedArticleItem } from "@/data/article";

type RelatedArticlesProps = {
  items: RelatedArticleItem[];
};

export function RelatedArticles({ items }: RelatedArticlesProps) {
  return (
    <section
      aria-labelledby="related-articles-title"
      className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 id="related-articles-title" className="text-3xl font-bold tracking-tight text-slate-950">
        Related Articles
      </h2>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.slug}>
            <RelatedArticleCard article={item} />
          </li>
        ))}
      </ul>

      <Link
        href="/news"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#2f67e8] px-6 py-3 text-base font-semibold text-[#2f67e8] transition-colors hover:bg-blue-50"
      >
        View all related →
      </Link>
    </section>
  );
}
