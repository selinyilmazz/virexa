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
    <article className="relative flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:flex-row sm:p-5">
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-2xl sm:aspect-auto sm:w-36 sm:self-stretch">
        <NewsImage
          src={image}
          fallbackSrc={resolveFallbackImageForCategory(category)}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, 144px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1 pr-8">
        <span className="inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-[#2f67e8]">
          {category}
        </span>
        <h3 className="mt-2.5 line-clamp-2 text-lg font-bold leading-snug text-slate-950">
          <Link href={`/article/${slug}`} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">{description}</p>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <span className="w-20 shrink-0 truncate font-medium sm:w-24">{source}</span>
          <span aria-hidden="true" className="shrink-0">
            •
          </span>
          <time className="truncate">{publishedDate}</time>
        </div>
      </div>

      <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
        <BookmarkButton
          item={{
            slug,
            image: typeof image === "string" ? image : "",
            category,
            title,
            description,
            source,
            publishedDate,
          }}
        />
      </div>
    </article>
  );
}
