import Link from "next/link";
import { BookmarkButton } from "@/components/news/BookmarkButton";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";
import type { ContentTypeFilter, NewsExplorerItem } from "@/services/articles/article-read-service";

const CONTENT_TYPE_LABELS: Record<ContentTypeFilter, string> = {
  news: "News",
  release: "Release",
  tutorial: "Tutorial",
  research: "Research",
  "security-advisory": "Security Advisory",
  certification: "Certification",
  "open-source": "Open Source",
};

/**
 * Human labels for `matched_in` raw values (`search_articles_fts()`'s
 * result field - see `FullTextSearchRow`'s doc comment). Ported verbatim
 * from the old, now-orphaned `SearchResults.tsx`'s "Matched in X" badge.
 */
const MATCH_LABELS: Record<string, string> = {
  title: "Title",
  ai_summary: "AI Summary",
  description: "Description",
  content: "Content",
  tags: "Tags",
  source: "Source",
  author: "Author",
  category: "Category",
  other: "Content",
};

function matchLabel(matchedIn: string): string {
  return MATCH_LABELS[matchedIn] ?? "Content";
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Google-style keyword highlighter - wraps every visible occurrence of any
 * word in `query` inside `text` with a subtle yellow `<mark>`. Ported
 * verbatim from the old, now-orphaned `SearchResultCard.tsx`'s
 * `HighlightedText`. Only ever receives a `query` via this card's
 * `highlightQuery` prop, which `ExplorerView` only sets on `/search` (see
 * its `explainMatches` prop) - so highlighting never runs on `/news`,
 * category pages, or the homepage.
 */
function HighlightedText({ text, query }: { text: string; query?: string }) {
  const words = (query ?? "").trim().split(/\s+/).filter((word) => word.length > 0);
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

type NewsExplorerCardProps = {
  item: NewsExplorerItem;
  /**
   * Search Results-only: the query to highlight inside this card's title/
   * description and to explain via a "Matched "X" • Found in Y" badge
   * (using `item.matchedIn`, only populated on the direct FTS path - see
   * `getNewsExplorerArticles`'s doc comment). `undefined` everywhere else
   * (News Explorer/category pages/home), per the unified-Explorer spec:
   * only Search Results explains why an article matched.
   */
  highlightQuery?: string;
};

/**
 * News Explorer's article row - thumbnail/category/headline/2-line
 * summary/source/date/reading-time/bookmark, a soft hover lift (not the
 * homepage `NewsCard`'s big vertical card - a denser horizontal row fits
 * a "browse everything" list better than an editorial grid, per the
 * page's own design goal).
 */
export function NewsExplorerCard({ item, highlightQuery }: NewsExplorerCardProps) {
  return (
    <article className="group relative flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <span className="relative hidden size-28 shrink-0 overflow-hidden rounded-xl sm:block">
        <NewsImage
          src={item.image}
          fallbackSrc={resolveFallbackImageForCategory(item.category)}
          alt={item.title}
          fill
          sizes="112px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </span>

      <div className="min-w-0 flex-1">
        {highlightQuery && item.matchedIn && (
          <p className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
            Matched &quot;{highlightQuery}&quot;
            <span aria-hidden="true" className="text-amber-400">
              •
            </span>
            Found in {matchLabel(item.matchedIn)}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{item.category}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
            {CONTENT_TYPE_LABELS[item.contentType]}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-950">
          <Link href={`/article/${item.slug}`} className="after:absolute after:inset-0">
            <HighlightedText text={item.title} query={highlightQuery} />
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
          <HighlightedText text={item.description} query={highlightQuery} />
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{item.source}</span>
          <span aria-hidden="true">·</span>
          <time>{item.publishedDate}</time>
          {item.readingTime && (
            <>
              <span aria-hidden="true">·</span>
              <span>{item.readingTime}</span>
            </>
          )}
        </div>
      </div>

      <BookmarkButton
        item={{
          slug: item.slug,
          image: typeof item.image === "string" ? item.image : "",
          category: item.category,
          title: item.title,
          description: item.description,
          source: item.source,
          publishedDate: item.publishedDate,
        }}
        className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm hover:bg-white sm:right-5 sm:top-5"
      />
    </article>
  );
}
