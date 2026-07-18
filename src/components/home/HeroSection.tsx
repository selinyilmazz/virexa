import Link from "next/link";
import { findCategoryHref } from "@/data/article";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";
import { getFeaturedArticle } from "@/services/articles/article-read-service";

const FALLBACK = {
  badge: "🔥 Trending Now",
  category: "Technology",
  title: "OpenAI unveils GPT-5: Smarter, faster, and more capable than ever",
  summary:
    "The latest generation of AI introduces major advancements in reasoning, coding and multimodal understanding, marking a significant step forward.",
  source: "Virexa",
  articleHref: "/article/openai-gpt5",
  categoryHref: "/category/technology",
};

/**
 * Premium, image-dominant hero (product redesign: "large 16:9 visual
 * with overlay content", replacing the old split layout that gave the
 * photo a small, secondary box next to the text). The real article
 * photo IS the section now - full-bleed `fill` image at a fixed 16:9
 * aspect ratio, with headline/dek/actions layered directly on top over
 * a bottom-anchored gradient scrim for legibility, the same visual
 * pattern Apple News/big editorial homepages use for a lead story.
 */
export async function HeroSection() {
  const featured = await getFeaturedArticle();

  const badge = featured ? (featured.hasAIInsights ? "🤖 AI Recommended" : "🔥 Trending Now") : FALLBACK.badge;
  const category = featured?.category ?? FALLBACK.category;
  const title = featured?.title ?? FALLBACK.title;
  const summary = featured?.description ?? FALLBACK.summary;
  const source = featured?.source ?? FALLBACK.source;
  const publishedDate = featured?.publishedDate;
  const articleHref = featured ? `/article/${featured.slug}` : FALLBACK.articleHref;
  const categoryHref = featured ? findCategoryHref(featured.category) : FALLBACK.categoryHref;
  const image = featured?.image ?? resolveFallbackImageForCategory(category);

  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-[1280px]">
      <div className="relative aspect-video w-full overflow-hidden rounded-3xl shadow-lg shadow-slate-900/10 sm:aspect-[16/8] lg:aspect-[16/7]">
        <NewsImage
          src={image}
          fallbackSrc={resolveFallbackImageForCategory(category)}
          alt={title}
          fill
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover"
          priority
        />

        {/* Bottom-anchored scrim - keeps overlaid text legible against any photo without flattening the image itself. */}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.55)_38%,rgba(2,6,23,0.05)_68%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(2,6,23,0.35)_0%,transparent_55%)]" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-white/95 px-3.5 py-1.5 text-sm font-semibold text-slate-900 backdrop-blur-sm">
              {badge}
            </span>
            <Link
              href={categoryHref}
              className="inline-flex items-center rounded-full border border-white/40 px-3.5 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:border-white hover:text-white"
            >
              {category}
            </Link>
          </div>

          <h1
            id="hero-title"
            className="max-w-3xl text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            <Link href={articleHref} className="transition-opacity hover:opacity-90">
              {title}
            </Link>
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">{summary}</p>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Link
              href={articleHref}
              className="rounded-2xl bg-white px-6 py-3 text-base font-semibold text-slate-950 transition-colors hover:bg-slate-100"
            >
              Read Full Story →
            </Link>
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <span>{source}</span>
              {publishedDate && (
                <>
                  <span aria-hidden="true">•</span>
                  <time>{publishedDate}</time>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
