import Link from "next/link";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";
import type { RelatedArticleItem } from "@/data/article";

type RelatedArticleCardProps = {
  article: RelatedArticleItem;
};

export function RelatedArticleCard({ article }: RelatedArticleCardProps) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <span className="relative size-20 shrink-0 overflow-hidden rounded-xl">
        <NewsImage
          src={article.image}
          fallbackSrc={resolveFallbackImageForCategory(undefined)}
          alt={article.title}
          fill
          sizes="80px"
          className="object-cover"
        />
      </span>
      <div className="min-w-0">
        <p className="line-clamp-2 text-base font-semibold leading-snug text-slate-950">{article.title}</p>
        <p className="mt-1.5 text-sm text-slate-500">
          {article.source} <span aria-hidden="true">•</span> {article.publishedDate}
        </p>
      </div>
    </Link>
  );
}
