import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { CategoryHeader } from "@/components/category/CategoryHeader";
import { CategoryNewsGrid } from "@/components/category/CategoryNewsGrid";
import { CategorySidebar } from "@/components/category/CategorySidebar";
import { Pagination } from "@/components/category/Pagination";
import { categories, getCategoryBySlug } from "@/data/categories";

const PAGE_SIZE = 8;

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const totalPages = Math.max(1, Math.ceil(category.news.length / PAGE_SIZE));
  const requestedPage = Number(page ?? "1");
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(1, requestedPage), totalPages) : 1;
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = category.news.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <CategoryHeader
            name={category.name}
            description={category.description}
            articleCount={category.news.length}
            breadcrumb={category.breadcrumb}
          />

          <div className="mt-5 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.42fr)]">
            <div className="min-w-0">
              <CategoryNewsGrid items={pageItems} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                buildHref={(targetPage) => `/category/${category.slug}?page=${targetPage}`}
              />
            </div>

            <aside className="min-w-0 xl:self-start">
              <CategorySidebar tags={category.popularTags} recentNews={category.news.slice(0, 5)} />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
