import type { ImageProps } from "next/image";
import Link from "next/link";
import { BookmarkButton } from "@/components/news/BookmarkButton";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";

type NewsCardProps = {
  slug: string;
  image: ImageProps["src"];
  category: string;
  title: string;
  description: string;
  source: string;
  publishedDate: string;
};

/**
 * Redesigned "Latest News" card (premium homepage redesign): image on
 * top at a real 16:9 aspect ratio instead of the old small side thumbnail,
 * with the category badge floated over the photo (not the text column)
 * and a clearer typographic scale below - a bold, larger title, a
 * shorter one-line dek, and a compact meta row. Same underlying data as
 * before; the layout is what changed.
 */
export function NewsCard({
  slug,
  image,
  category,
  title,
  description,
  source,
  publishedDate,
}: NewsCardProps) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden">
        <NewsImage
          src={image}
          fallbackSrc={resolveFallbackImageForCategory(category)}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 620px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(to_top,rgba(2,6,23,0.35),transparent)]" />

        <span className="absolute left-3.5 top-3.5 inline-flex rounded-full bg-white/95 px-3.5 py-1 text-xs font-semibold text-slate-900 shadow-sm backdrop-blur-sm">
          {category}
        </span>

        <BookmarkButton
          item={{ slug, image: typeof image === "string" ? image : "", category, title, description, source, publishedDate }}
          className="absolute right-3.5 top-3.5 flex size-9 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm hover:bg-white"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-xl font-bold leading-snug tracking-tight text-slate-950">
          <Link href={`/article/${slug}`} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{description}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
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
