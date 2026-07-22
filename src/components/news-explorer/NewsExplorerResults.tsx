import { NewsExplorerCard } from "@/components/news-explorer/NewsExplorerCard";
import type { NewsExplorerItem } from "@/services/articles/article-read-service";

type NewsExplorerResultsProps = {
  items: NewsExplorerItem[];
  /** Search Results-only match explanation query - see `NewsExplorerCard`'s `highlightQuery` doc comment. `undefined` on every other Explorer route. */
  highlightQuery?: string;
};

/**
 * News Explorer's article list - plain server-rendered rows (no
 * "Load More"/client state - see `NewsExplorerPagination` for real
 * server-side page navigation instead).
 */
export function NewsExplorerResults({ items, highlightQuery }: NewsExplorerResultsProps) {
  if (items.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center">
        <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
          🔍
        </span>
        <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-950">No articles match these filters</h3>
        <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">
          Try widening your filters or clearing the search.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {items.map((item) => (
        <NewsExplorerCard key={item.slug} item={item} highlightQuery={highlightQuery} />
      ))}
    </div>
  );
}
