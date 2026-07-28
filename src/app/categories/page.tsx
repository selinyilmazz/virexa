import { Header } from "@/components/layout/Header";
import { CategoriesHero } from "@/components/categories/CategoriesHero";
import { CategoryGrid } from "@/components/categories/CategoryGrid";
import { categories } from "@/data/categories";
import { getServerTranslations } from "@/i18n/get-server-translations";

export default async function CategoriesPage() {
  const { t } = await getServerTranslations();
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <CategoriesHero
            title={t("categoriesPage.title")}
            description={t("categoriesPage.description")}
          />

          <div className="mt-8">
            <CategoryGrid categories={categories} />
          </div>
        </div>
      </main>
    </>
  );
}
