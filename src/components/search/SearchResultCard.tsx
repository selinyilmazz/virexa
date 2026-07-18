import type { ImageProps } from "next/image";
import Link from "next/link";
import { BookmarkButton } from "@/components/news/BookmarkButton";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";

type SearchResultCardProps = {
  slug: string;
  image: ImageProps["src"];
  category: string;
  title: string;
  description: string;
  source: string;
  publishedDate: string;
};

/**
 * Dedicated Compact Search Card (product polishing phase, area 2/3):
 * search is for quickly scanning many results, so this is a horizontal
 * row (small thumbnail + content) rather than the homepage `NewsCard`'s
 * full 16:9 image-on-top layout - noticeably shorter per row, so more
 * results fit on one screen, while keeping the same rounded-card/border/
 * hover-lift visual language as every other card variant.
 */
export function SearchResultCard({ slug, image, category, title, description, source, publishedDate }: SearchResultCardProps) {
  return (
    <article className="group relative flex gap-3.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md sm:gap-4 sm:p-3.5">
      <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl sm:w-24">
        <NewsImage
          src={image}
          fallbackSrc={resolveFallbackImageForCategory(category)}
          alt={title}
          fill
          sizes="96px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5 pr-8">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{category}</span>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-slate-950 sm:text-base">
          <Link href={`/article/${slug}`} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-slate-500 sm:text-sm">{description}</p>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
          <span className="truncate font-semibold text-slate-700">{source}</span>
          <span aria-hidden="true" className="shrink-0 text-slate-300">
            •
          </span>
          <time className="truncate">{publishedDate}</time>
        </div>
      </div>

      <BookmarkButton
        item={{ slug, image: typeof image === "string" ? image : "", category, title, description, source, publishedDate }}
        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm hover:bg-white"
      />
    </article>
  );
}
