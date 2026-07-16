import { NewsCard } from "@/components/news/NewsCard";
import type { CategoryNewsItem } from "@/data/categories";

type CategoryNewsGridProps = {
  items: CategoryNewsItem[];
};

export function CategoryNewsGrid({ items }: CategoryNewsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map(({ id, ...card }) => (
        <NewsCard key={id} {...card} />
      ))}
    </div>
  );
}
