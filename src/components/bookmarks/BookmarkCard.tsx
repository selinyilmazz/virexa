import type { ImageProps } from "next/image";
import Link from "next/link";
import { BookmarkButton } from "@/components/news/BookmarkButton";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";

type BookmarkCardProps = {
  slug: string;
  image: ImageProps["src"];
  category: string;
  title: string;
  description: string;
  source: string;
  publishedDate: string;
};

/**
 * Dedicated Bookmark Card (product polishing phase, area 3): a compact
 * horizontal row - like `SearchResultCard`, but with a visible category
 * pill (a saved-articles list spans every category, unlike a category
 * page or a single search result set) - so a list of saved articles
 * reads as a scannable feed instead of a stack of full homepage cards.
 * The bookmark button here doubles as the remove action (every item is
 * already saved, so a click un-saves it - same `BookmarkButton` used
 * everywhere else, just toggling the other direction).
 */
export function BookmarkCard({ slug, image, category, title, description, source, publishedDate }: BookmarkCardProps) {
  return (
    <article className="group relative flex gap-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
      <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl sm:w-28 sm:aspect-video">
        <NewsImage
          src={image}
          fallbackSrc={resolveFallbackImageForCategory(category)}
          alt={title}
          fill
          sizes="112px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5 pr-8">
        <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
          {category}
        </span>
        <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-slate-950">
          <Link href={`/article/${slug}`} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>
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
