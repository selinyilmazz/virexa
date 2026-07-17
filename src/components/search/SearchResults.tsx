import { NewsCard } from "@/components/news/NewsCard";
import { EmptySearchState } from "@/components/search/EmptySearchState";
import type { SearchResultItem } from "@/services/articles/article-read-service";

type SearchResultsProps = {
  query: string;
  items: SearchResultItem[];
  hasFilters: boolean;
};

// Maps `search_articles_fts()`'s `matched_in` value (see
// `supabase/migrations/0004_full_text_search.sql`) to the human label
// shown in the "Matched in X" badge (Search Highlight requirement 6).
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

/**
 * Wraps each `NewsCard` with a small "Matched in X" badge instead of
 * modifying `NewsCard` itself - `NewsCard` is shared across Home,
 * Category, and Search, and only text-query search results carry a
 * `matchedIn` value. Filter-only browse results (no text query - see
 * `searchArticlesReal`'s dual path) have no `matchedIn` at all, so the
 * badge is simply omitted for those cards rather than showing a
 * meaningless "Matched in Content" on every result.
 */
export function SearchResults({ query, items, hasFilters }: SearchResultsProps) {
  if (items.length === 0) {
    return <EmptySearchState query={query} hasFilters={hasFilters} />;
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.slug} className="space-y-2">
          {item.matchedIn && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              Matched in {matchLabel(item.matchedIn)}
            </span>
          )}
          <NewsCard {...item} />
        </div>
      ))}
    </div>
  );
}
