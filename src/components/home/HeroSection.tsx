import { FeaturedStoryCarousel } from "@/components/home/FeaturedStoryCarousel";
import type { FeaturedSlide } from "@/components/home/FeaturedStoryCarousel";
import { findCategoryHref } from "@/data/article";
import { resolveFallbackImageForCategory } from "@/lib/news";
import { getFeaturedArticles } from "@/services/articles/article-read-service";

const FALLBACK_SLIDE: FeaturedSlide = {
  slug: "openai-gpt5",
  category: "Technology",
  categoryHref: "/category/technology",
  title: "OpenAI unveils GPT-5: Smarter, faster, and more capable than ever",
  summary:
    "The latest generation of AI introduces major advancements in reasoning, coding and multimodal understanding, marking a significant step forward.",
  source: "Virexa",
  publishedDate: "",
  image: resolveFallbackImageForCategory("Technology"),
  fallbackImage: resolveFallbackImageForCategory("Technology"),
  articleHref: "/article/openai-gpt5",
};

/**
 * "Featured Story" - server data fetch only, the dark dot-navigated
 * carousel itself lives in the client component `FeaturedStoryCarousel`
 * (homepage redesign). Pulls the top 4 real trending articles
 * (`getFeaturedArticles`) instead of a single Hero article, so the
 * carousel has real stories on every dot rather than repeating one.
 * Falls back to a single static slide only when the database has
 * nothing yet (empty state, mirrors every other homepage section's
 * "render something reasonable instead of a blank section" convention).
 */
export async function HeroSection() {
  const featured = await getFeaturedArticles(4);

  const slides: FeaturedSlide[] =
    featured.length > 0
      ? featured.map((article) => ({
          slug: article.slug,
          category: article.category,
          categoryHref: findCategoryHref(article.category),
          title: article.title,
          summary: article.description,
          source: article.source,
          publishedDate: article.publishedDate,
          readingTime: article.readingTime,
          image: article.image,
          fallbackImage: resolveFallbackImageForCategory(article.category),
          articleHref: `/article/${article.slug}`,
        }))
      : [FALLBACK_SLIDE];

  return (
    <section aria-labelledby="hero-title">
      <h2 id="hero-title" className="sr-only">
        Featured Story
      </h2>
      <FeaturedStoryCarousel slides={slides} />
    </section>
  );
}
