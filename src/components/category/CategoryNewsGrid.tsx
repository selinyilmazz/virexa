import { CategoryCard } from "@/components/category/CategoryCard";
import type { CategoryNewsItem } from "@/data/categories";

type CategoryNewsGridProps = {
  items: CategoryNewsItem[];
};

export function CategoryNewsGrid({ items }: CategoryNewsGridProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {items.map((item) => (
        <CategoryCard key={item.slug} {...item} />
      ))}
    </div>
  );
}
