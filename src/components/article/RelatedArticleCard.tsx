import Image from "next/image";
import Link from "next/link";
import type { RelatedArticleItem } from "@/data/article";

type RelatedArticleCardProps = {
  article: RelatedArticleItem;
};

export function RelatedArticleCard({ article }: RelatedArticleCardProps) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className="flex items-center gap-3 rounded-2xl p-1 transition-colors hover:bg-slate-50"
    >
      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl">
        <Image src={article.image} alt={article.title} fill sizes="64px" className="object-cover" />
      </span>
      <div className="min-w-0">
        <p className="line-clamp-2 text-base font-semibold leading-snug text-slate-950">{article.title}</p>
        <p className="mt-1 text-sm text-slate-500">
          {article.source} <span aria-hidden="true">•</span> {article.publishedDate}
        </p>
      </div>
    </Link>
  );
}
