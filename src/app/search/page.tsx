import { Header } from "@/components/layout/Header";
import { SearchHeader } from "@/components/search/SearchHeader";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchSidebar } from "@/components/search/SearchSidebar";
import { searchArticles } from "@/data/search";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; time?: string; categories?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, time, categories } = await searchParams;
  const query = q?.trim() ?? "";
  const categorySlugs = categories ? categories.split(",").filter(Boolean) : [];
  const results = query ? searchArticles(query, { timeFilter: time, categorySlugs }) : [];

  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <SearchHeader query={query} resultCount={results.length} />

          <div className="mt-8 grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
            <aside className="min-w-0 xl:self-start">
              <SearchFilters />
            </aside>

            <div className="min-w-0">
              <SearchResults query={query} items={results} />
            </div>

            <aside className="min-w-0 xl:self-start">
              <SearchSidebar />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
