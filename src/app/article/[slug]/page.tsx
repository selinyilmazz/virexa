import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ArticleHero } from "@/components/article/ArticleHero";
import { ArticleMeta } from "@/components/article/ArticleMeta";
import { ShareButtons } from "@/components/article/ShareButtons";
import { ArticleContent } from "@/components/article/ArticleContent";
import { ArticleTags } from "@/components/article/ArticleTags";
import { RelatedArticles } from "@/components/article/RelatedArticles";
import { articles, getArticleBySlug } from "@/data/article";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {article.breadcrumb.map((crumb, index) => {
              const isLast = index === article.breadcrumb.length - 1;
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
            <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <ArticleHero
                image={article.coverImage}
                category={article.category}
                title={article.title}
                summary={article.summary}
              />

              <div className="mt-6 flex flex-col gap-4 border-y border-slate-200 py-5 sm:flex-row sm:items-center sm:justify-between">
                <ArticleMeta
                  authorName={article.author.name}
                  authorAvatar={article.author.avatar}
                  publishedDate={article.publishedDate}
                  readTime={article.readTime}
                />
                <ShareButtons />
              </div>

              <div className="mt-6">
                <ArticleContent
                  blocks={article.content}
                  sourceLabel={article.sourceLabel}
                  sourceUrl={article.sourceUrl}
                />
              </div>

              <div className="mt-8">
                <ArticleTags tags={article.tags} />
              </div>
            </div>

            <aside className="min-w-0">
              <RelatedArticles items={article.relatedArticles} />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
