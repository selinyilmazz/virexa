import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ArticleHero } from "@/components/article/ArticleHero";
import { ArticleMeta } from "@/components/article/ArticleMeta";
import { ShareButtons } from "@/components/article/ShareButtons";
import { ArticleContent } from "@/components/article/ArticleContent";
import { ArticleTags } from "@/components/article/ArticleTags";
import { ArticleAIInsights } from "@/components/article/ArticleAIInsights";
import { RelatedArticles } from "@/components/article/RelatedArticles";
import { findCategoryHref } from "@/data/article";
import type { RelatedArticleItem } from "@/data/article";
import { getArticleDetail, getSimilarArticles } from "@/services/articles/article-read-service";
import { incrementArticleView } from "@/services/articles/article-metrics-service";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleDetail(slug);

  if (!article) {
    return { title: "Article Not Found | Virexa" };
  }

  const description = article.description || article.title;
  const canonicalPath = `/article/${article.slug}`;

  return {
    title: `${article.title} | Virexa`,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: article.title,
      description,
      type: "article",
      url: canonicalPath,
      publishedTime: article.publishedAtIso,
      images: [{ url: article.image, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [article.image],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleDetail(slug);

  if (!article) {
    notFound();
  }

  // "Makale açıldığında view_count otomatik artsın" - fire-and-forget
  // safe (never throws, no-ops if storage isn't configured), so it
  // can't ever break rendering this page.
  void incrementArticleView(article.id);

  const similarArticles = await getSimilarArticles(article.category, article.id, 4);
  const relatedArticles: RelatedArticleItem[] = similarArticles.map((item) => ({
    slug: item.slug,
    image: item.image,
    title: item.title,
    source: item.source,
    publishedDate: item.publishedDate,
  }));

  const breadcrumb = [
    { label: "Home", href: "/" },
    { label: article.category, href: findCategoryHref(article.category) },
    { label: article.title, href: `/article/${article.slug}` },
  ];

  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {breadcrumb.map((crumb, index) => {
              const isLast = index === breadcrumb.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">›</span>}
                  {isLast ? (
                    <span className="font-medium text-slate-950">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="transition-colors hover:text-[#2f67e8]">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.42fr)]">
            <div className="min-w-0 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <ArticleHero
                  image={article.image}
                  category={article.category}
                  title={article.title}
                  summary={article.description}
                />

                <div className="mt-6 flex flex-col gap-4 border-y border-slate-200 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <ArticleMeta
                    authorName={article.source}
                    authorAvatar="/images/article/authors/newsroom.svg"
                    publishedDate={article.publishedDate}
                    readTime={article.readingTime}
                  />
                  <ShareButtons
                    title={article.title}
                    bookmarkItem={{
                      slug: article.slug,
                      image: article.image,
                      category: article.category,
                      title: article.title,
                      description: article.description,
                      source: article.source,
                      publishedDate: article.publishedDate,
                    }}
                  />
                </div>

                <div className="mt-6">
                  <ArticleContent blocks={article.content} sourceLabel={article.source} sourceUrl={article.sourceUrl} />
                </div>

                <div className="mt-8">
                  <ArticleTags tags={article.tags} />
                </div>
              </div>

              <ArticleAIInsights ai={article.ai} trustScore={article.trustScore} trendingScore={article.trendingScore} />
            </div>

            <aside className="min-w-0">
              <RelatedArticles items={relatedArticles} viewAllHref={findCategoryHref(article.category)} />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
