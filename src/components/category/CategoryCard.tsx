import type { ImageProps } from "next/image";
import Link from "next/link";
import { BookmarkButton } from "@/components/news/BookmarkButton";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";

type CategoryCardProps = {
  slug: string;
  image: ImageProps["src"];
  category: string;
  title: string;
  description: string;
  source: string;
  publishedDate: string;
};

/**
 * Dedicated Category Card (product polishing phase, area 3): same
 * image-on-top visual language as the homepage `NewsCard`, but tuned for
 * a category page's dense, same-topic grid - slightly tighter padding
 * and a one-line description instead of two, so a page of 8 articles
 * reads as a scannable grid rather than a stack of homepage-sized
 * feature cards. The category badge is omitted (redundant - every card
 * on this page is already the same category), freeing that corner for
 * nothing but the bookmark button.
 */
export function CategoryCard({ slug, image, category, title, description, source, publishedDate }: CategoryCardProps) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden">
        <NewsImage
          src={image}
          fallbackSrc={resolveFallbackImageForCategory(category)}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-14 bg-[linear-gradient(to_top,rgba(2,6,23,0.3),transparent)]" />

        <BookmarkButton
          item={{ slug, image: typeof image === "string" ? image : "", category, title, description, source, publishedDate }}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm hover:bg-white"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-950">
          <Link href={`/article/${slug}`} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-1 text-sm leading-relaxed text-slate-500">{description}</p>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <span className="truncate font-semibold text-slate-700">{source}</span>
          <span aria-hidden="true" className="shrink-0 text-slate-300">
            •
          </span>
          <time className="truncate">{publishedDate}</time>
        </div>
      </div>
    </article>
  );
}
