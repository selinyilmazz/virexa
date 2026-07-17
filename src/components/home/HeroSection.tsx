import Link from "next/link";
import { findCategoryHref } from "@/data/article";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";
import { getFeaturedArticle } from "@/services/articles/article-read-service";

const FALLBACK = {
  badge: "🔥 Trending Now",
  title: "OpenAI unveils GPT-5: Smarter, faster, and more capable than ever",
  summary:
    "The latest generation of AI introduces major advancements in reasoning, coding and multimodal understanding, marking a significant step forward.",
  articleHref: "/article/openai-gpt5",
  categoryHref: "/category/technology",
};

export async function HeroSection() {
  const featured = await getFeaturedArticle();

  const badge = featured ? (featured.hasAIInsights ? "🤖 AI Recommended" : "🔥 Trending Now") : FALLBACK.badge;
  const title = featured?.title ?? FALLBACK.title;
  const summary = featured?.description ?? FALLBACK.summary;
  const articleHref = featured ? `/article/${featured.slug}` : FALLBACK.articleHref;
  const categoryHref = featured ? findCategoryHref(featured.category) : FALLBACK.categoryHref;

  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto grid max-w-[1280px] gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:gap-10 lg:p-8"
    >
      <div className="max-w-xl">
        <p className="text-base font-semibold text-slate-800">{badge}</p>
        <h1
          id="hero-title"
          className="mt-4 max-w-[32rem] text-4xl font-bold leading-tight tracking-tight text-slate-950"
        >
          {title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-500 sm:text-xl">
          {summary}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={articleHref}
            className="rounded-2xl bg-[#2f67e8] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#2556c9]"
          >
            Read Full Story →
          </Link>
          <Link
            href={categoryHref}
            className="rounded-2xl border-2 border-[#2f67e8] px-6 py-3 text-base font-semibold text-[#2f67e8] transition-colors hover:bg-blue-50"
          >
            View All Trending →
          </Link>
        </div>
      </div>

      <div
        role="img"
        aria-label={featured ? featured.title : "Placeholder for the featured trending story image"}
        className="relative min-h-72 overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_58%_86%,rgba(245,158,11,0.9),transparent_12%),linear-gradient(145deg,#06172c_0%,#12294b_44%,#742c2c_100%)] sm:min-h-80 lg:min-h-[350px]"
      >
        {featured && (
          <NewsImage
            src={featured.image}
            fallbackSrc={resolveFallbackImageForCategory(featured.category)}
            alt={featured.title}
            fill
            sizes="(max-width: 1024px) 100vw, 640px"
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(2,6,23,0.8),transparent)]" />
        <div className="absolute inset-x-[18%] bottom-0 h-[42%] rounded-t-[48%] bg-slate-950/70 blur-sm" />
      </div>
    </section>
  );
}
