import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ArticleHero } from "@/components/article/ArticleHero";
import { ArticleHeaderBlock } from "@/components/article/ArticleHeaderBlock";
import { ArticleMeta } from "@/components/article/ArticleMeta";
import { ShareButtons } from "@/components/article/ShareButtons";
import { ArticleContent } from "@/components/article/ArticleContent";
import { ArticleOriginalSourceCard } from "@/components/article/ArticleOriginalSourceCard";
import { ArticleTrendingNow } from "@/components/article/ArticleTrendingNow";
import { ArticleTopDiscussions } from "@/components/article/ArticleTopDiscussions";
import { resolvePulseTopicForCategory } from "@/lib/article/article-sidebar-data";
import { findCategoryHref } from "@/data/article";
import { getArticleDetail } from "@/services/articles/article-read-service";
import { incrementArticleView, recordArticleRead } from "@/services/articles/article-metrics-service";
import { createClient } from "@/lib/supabase/server";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleDetail(slug);

  if (!article || !article.visible) {
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

  if (!article || !article.visible) {
    notFound();
  }

  // "Makale açıldığında view_count otomatik artsın" - fire-and-forget
  // safe (never throws, no-ops if storage isn't configured), so it
  // can't ever break rendering this page.
  void incrementArticleView(article.id);

  // Real per-user reading history - only written for a signed-in
  // visitor; an anonymous reader still bumps `view_count` above but has
  // no per-user history to record. Wrapped defensively for the same
  // reason the root layout's own session read is - a transient
  // auth/storage hiccup here must never break rendering the article
  // itself.
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      void recordArticleRead(user.id, {
        articleId: article.id,
        slug: article.slug,
        title: article.title,
        image: article.image,
        category: article.category,
        source: article.source,
        readingTime: article.readingTime,
      });
    }
  } catch (error) {
    console.error("[ArticlePage] Failed to resolve session for reading history:", error);
  }

  // Editorial redesign - the page's deck (see `ArticleHeaderBlock`'s doc
  // comment): real AI-derived text only, NEVER the raw RSS `description`
  // (this app's established rule). Whichever of these is chosen here is
  // deliberately skipped again inside `ArticleContent`'s body so the same
  // sentence never appears twice on the page.
  const deck = article.rewrittenArticle?.intro ?? article.structuredSummary?.overview ?? null;

  const pulseTopic = resolvePulseTopicForCategory(article.category);

  const breadcrumb = [
    { label: "Home", href: "/" },
    { label: article.category, href: findCategoryHref(article.category) },
    { label: article.source, href: `/news?sources=${article.sourceId}` },
    { label: article.title, href: null },
  ];

  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-[1440px]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            {breadcrumb.map((crumb, index) => {
              const isLast = index === breadcrumb.length - 1;
              return (
                <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                  {index > 0 && <span aria-hidden="true">/</span>}
                  {isLast || !crumb.href ? (
                    <span className="truncate font-medium text-slate-700">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="truncate transition-colors hover:text-[#2f67e8]">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            <article className="min-w-0">
              <ArticleHero image={article.image} category={article.category} title={article.title} />

              <div className="mt-8">
                <ArticleHeaderBlock category={article.category} title={article.title} deck={deck} />
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <ArticleMeta
                  sourceLogo={article.sourceLogo}
                  sourceName={article.source}
                  publishedDate={article.publishedDate}
                  readTime={article.readingTime}
                  viewCount={article.viewCount}
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

              <div className="mt-6 border-t border-slate-200" />

              <div className="mt-8">
                <ArticleContent
                  blocks={article.content}
                  structuredSummary={article.structuredSummary}
                  rewrittenArticle={article.rewrittenArticle}
                />
              </div>

              <div className="mt-10">
                <ArticleOriginalSourceCard
                  sourceLogo={article.sourceLogo}
                  sourceName={article.source}
                  sourceWebsite={article.sourceWebsite}
                  sourceUrl={article.sourceUrl}
                />
              </div>
            </article>

            <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
              <ArticleTrendingNow topic={pulseTopic} />
              <ArticleTopDiscussions topic={pulseTopic} />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
