import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { CategoryHeader } from "@/components/category/CategoryHeader";
import { CategoryNewsGrid } from "@/components/category/CategoryNewsGrid";
import { CategorySidebar } from "@/components/category/CategorySidebar";
import { Pagination } from "@/components/category/Pagination";
import { ExplorerView } from "@/components/explorer/ExplorerView";
import { categories, getCategoryBySlug } from "@/data/categories";
import type { PulseTopicKey } from "@/lib/explorer/developer-pulse-data";
import type { ExplorerSearchParams } from "@/lib/news-explorer/shared";
import {
  getRecentArticlesForCategory,
  getTopSourcesForCategory,
  getTrendingCategories,
  searchCategoryArticles,
} from "@/services/articles/article-read-service";

const PAGE_SIZE = 8;

/**
 * Real categories moved onto the unified Explorer template (per the
 * unified-Explorer design - "Do NOT create different layouts for...
 * categories... reuse the exact same News Explorer template"). Every
 * OTHER real category (Technology, Business, World, Robotics, Mobile,
 * Startup, Space, Science) was NOT named in that request and keeps this
 * route's original `CategoryHeader`/`CategoryNewsGrid`/`CategorySidebar`
 * layout entirely unchanged below.
 *
 * Stabilization pass: "Games" and "Mobile Games" (new) join this map so
 * they behave exactly like AI/Programming/Security - both are now
 * top-level `CategoryNav` items. Neither has a dedicated Developer Pulse
 * topic (that widget is developer-audience-specific), so both use the
 * "general" fallback `pulseTopic`, same as Cloud/Open Source's dedicated
 * top-level routes.
 */
const EXPLORER_CATEGORIES: Record<string, { title: string; subtitle: string; pulseTopic: PulseTopicKey }> = {
  ai: { title: "Artificial Intelligence", subtitle: "Latest AI news, model releases, research and developer updates.", pulseTopic: "ai" },
  programming: {
    title: "Programming",
    subtitle: "Latest programming news, frameworks, languages and developer tools.",
    pulseTopic: "programming",
  },
  security: {
    title: "Security",
    subtitle: "Security news, CVEs, vulnerabilities and industry advisories.",
    pulseTopic: "security",
  },
  games: {
    title: "Games",
    subtitle: "Console, PC, and industry gaming news - releases, studios, esports, and the tech behind the games.",
    pulseTopic: "general",
  },
  "mobile-games": {
    title: "Mobile Games",
    subtitle: "Mobile gaming news - hit titles, studios, monetization trends, and the platforms powering play on the go.",
    pulseTopic: "general",
  },
};

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ExplorerSearchParams>;
};

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const explorerConfig = EXPLORER_CATEGORIES[slug];
  if (explorerConfig) {
    return { title: `${explorerConfig.title} | VIREXA`, description: explorerConfig.subtitle };
  }
  const category = getCategoryBySlug(slug);
  return category ? { title: `${category.name} | VIREXA`, description: category.description } : {};
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;

  const explorerConfig = EXPLORER_CATEGORIES[slug];
  if (explorerConfig) {
    const resolvedSearchParams = await searchParams;
    return (
      <ExplorerView
        title={explorerConfig.title}
        subtitle={explorerConfig.subtitle}
        basePath={`/category/${slug}`}
        searchParams={resolvedSearchParams}
        defaultCategorySlug={slug}
        pulseTopic={explorerConfig.pulseTopic}
      />
    );
  }

  const { page } = await searchParams;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const requestedPage = Number(page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  // Real, database-backed news + pagination for this category ("kategori
  // sayfası gerçek veritabanından beslenecek"). Taxonomy (name,
  // description, breadcrumb) still comes from the static registry above -
  // the article list, pagination, and every sidebar widget are live.
  const [newsPage, recentNews, topSources, allActiveCategories] = await Promise.all([
    searchCategoryArticles(category.name, currentPage, PAGE_SIZE),
    getRecentArticlesForCategory(category.name, 5),
    getTopSourcesForCategory(category.name, 5),
    getTrendingCategories(12),
  ]);
  const relatedCategories = allActiveCategories
    .filter((entry) => entry.name !== category.name)
    .slice(0, 6)
    .map((entry) => ({ name: entry.name, icon: entry.icon, count: entry.count }));

  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <CategoryHeader
            name={category.name}
            description={category.description}
            articleCount={newsPage.total}
            breadcrumb={category.breadcrumb}
          />

          <div className="mt-5 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.42fr)]">
            <div className="min-w-0">
              {newsPage.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                  <span className="text-4xl" aria-hidden="true">
                    📰
                  </span>
                  <p className="mt-3 text-base font-semibold text-slate-700">No articles yet</p>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    No {category.name.toLowerCase()} articles have been published yet. Check back soon.
                  </p>
                </div>
              ) : (
                <>
                  <CategoryNewsGrid items={newsPage.items} />
                  <Pagination
                    currentPage={newsPage.page}
                    totalPages={newsPage.totalPages}
                    buildHref={(targetPage) => `/category/${category.slug}?page=${targetPage}`}
                  />
                </>
              )}
            </div>

            <aside className="min-w-0 xl:self-start">
              <CategorySidebar topSources={topSources} relatedCategories={relatedCategories} recentNews={recentNews} />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
