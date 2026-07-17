import { NewsCard } from "@/components/news/NewsCard";
import { EmptySearchState } from "@/components/search/EmptySearchState";
import type { CategoryNewsItem } from "@/data/categories";

type SearchResultsProps = {
  query: string;
  items: CategoryNewsItem[];
};

export function SearchResults({ query, items }: SearchResultsProps) {
  if (items.length === 0) {
    return <EmptySearchState query={query} />;
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <NewsCard key={item.slug} {...item} />
      ))}
    </div>
  );
}
