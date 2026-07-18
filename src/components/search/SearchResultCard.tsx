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
  /** The searched text, used to highlight every occurrence of each search word in the title/description (product polishing phase, 2nd pass - "aranan kelimeyi ... highlight et"). Omitted/empty for filter-only browsing with no text query. */
  query?: string;
};

/** Escapes regex-special characters in a literal search word before it goes into a `RegExp`. */
function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlights every occurrence of every word in `query` inside `text`,
 * Google-style (each word matched independently and case-insensitively,
 * not just an exact full-phrase match) - "Google arama mantığına benzer
 * bir deneyim oluştur." Splits `text` on a single alternation regex
 * built from `query`'s words, then checks each resulting piece against
 * a lowercased word set (rather than re-testing the same stateful
 * global `RegExp`, which would silently skip matches due to `lastIndex`
 * carrying over between calls).
 */
function HighlightedText({ text, query }: { text: string; query?: string }) {
  const words = (query ?? "")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  if (words.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${words.map(escapeForRegex).join("|")})`, "gi");
  const matchSet = new Set(words.map((word) => word.toLowerCase()));
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        matchSet.has(part.toLowerCase()) ? (
          <mark key={index} className="rounded-[3px] bg-amber-200/80 px-0.5 text-slate-950">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

/**
 * Dedicated Compact Search Card (product polishing phase, area 2/3):
 * search is for quickly scanning many results, so this is a horizontal
 * row (small thumbnail + content) rather than the homepage `NewsCard`'s
 * full 16:9 image-on-top layout - noticeably shorter per row, so more
 * results fit on one screen, while keeping the same rounded-card/border/
 * hover-lift visual language as every other card variant.
 */
export function SearchResultCard({ slug, image, category, title, description, source, publishedDate, query }: SearchResultCardProps) {
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
            <HighlightedText text={title} query={query} />
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
          <HighlightedText text={description} query={query} />
        </p>
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
