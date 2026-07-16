import Image, { type ImageProps } from "next/image";

type NewsCardProps = {
  image: ImageProps["src"];
  category: string;
  title: string;
  description: string;
  source: string;
  publishedDate: string;
  isBookmarked: boolean;
};

export function NewsCard({
  image,
  category,
  title,
  description,
  source,
  publishedDate,
  isBookmarked,
}: NewsCardProps) {
  return (
    <article className="relative flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:flex-row sm:p-5">
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-2xl sm:aspect-auto sm:w-36 sm:self-stretch">
        <Image src={image} alt={title} fill sizes="(max-width: 640px) 100vw, 144px" className="object-cover" />
      </div>

      <div className="min-w-0 flex-1 pr-8">
        <span className="inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-[#2f67e8]">
          {category}
        </span>
        <h3 className="mt-2.5 line-clamp-2 text-lg font-bold leading-snug text-slate-950">{title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">{description}</p>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <span className="w-20 shrink-0 truncate font-medium sm:w-24">{source}</span>
          <span aria-hidden="true" className="shrink-0">
            •
          </span>
          <time className="truncate">{publishedDate}</time>
        </div>
      </div>

      <span
        role="img"
        aria-label={isBookmarked ? "Bookmarked" : "Not bookmarked"}
        className={`absolute right-4 top-4 transition-colors sm:right-5 sm:top-5 ${
          isBookmarked ? "text-[#2f67e8]" : "text-slate-400"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill={isBookmarked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
        </svg>
      </span>
    </article>
  );
}
