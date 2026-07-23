import type { ImageProps } from "next/image";
import Link from "next/link";
import { BookmarkButton } from "@/components/news/BookmarkButton";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";

type ArticleBookmarkCardProps = {
  slug: string;
  image: ImageProps["src"];
  category: string;
  title: string;
  description: string;
  source: string;
  publishedDate: string;
  readingTime?: string;
};

/**
 * Article bookmark card (Bookmarks redesign) - same visual language as
 * the News Explorer's `NewsExplorerCard` (thumbnail/category/title/
 * summary/source/date/reading-time/bookmark), per the spec's "use exactly
 * the same card style as Explorer" requirement, rather than the old
 * compact row (`BookmarkCard.tsx`, now superseded by this file).
 */
export function ArticleBookmarkCard({
  slug,
  image,
  category,
  title,
  description,
  source,
  publishedDate,
  readingTime,
}: ArticleBookmarkCardProps) {
  return (
    <article className="group relative flex gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <span className="relative hidden size-28 shrink-0 overflow-hidden rounded-xl sm:block">
        <NewsImage
          src={image}
          fallbackSrc={resolveFallbackImageForCategory(category)}
          alt={title}
          fill
          sizes="112px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </span>

      <div className="min-w-0 flex-1">
        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600">{category}</span>

        <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-950 dark:text-white">
          <Link href={`/article/${slug}`} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{source}</span>
          <span aria-hidden="true">·</span>
          <time>{publishedDate}</time>
          {readingTime && (
            <>
              <span aria-hidden="true">·</span>
              <span>{readingTime}</span>
            </>
          )}
        </div>
      </div>

      <BookmarkButton
        item={{ slug, image: typeof image === "string" ? image : "", category, title, description, source, publishedDate }}
        className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm hover:bg-white sm:right-5 sm:top-5"
      />
    </article>
  );
}
