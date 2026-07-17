import { CategoryCard } from "@/components/categories/CategoryCard";
import type { Category } from "@/data/categories";

type CategoryGridProps = {
  categories: Category[];
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => (
        <CategoryCard
          key={category.slug}
          slug={category.slug}
          icon={category.icon}
          name={category.name}
          description={category.description}
          articleCount={category.news.length}
        />
      ))}
    </div>
  );
}
