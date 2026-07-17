import { Header } from "@/components/layout/Header";
import { CategoriesHero } from "@/components/categories/CategoriesHero";
import { CategoryGrid } from "@/components/categories/CategoryGrid";
import { categories } from "@/data/categories";

export default function CategoriesPage() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <CategoriesHero
            title="Explore Categories"
            description="Browse Virexa's full coverage across technology, business, science, and more — find the topics that matter to you."
          />

          <div className="mt-8">
            <CategoryGrid categories={categories} />
          </div>
        </div>
      </main>
    </>
  );
}
