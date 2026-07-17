import { formatPublishedDate } from "@/lib/news";
import { getLiveArticlesSync } from "@/services/news";

export type MostReadItem = {
  rank: number;
  title: string;
  views: string;
  slug: string;
  image: string;
  category: string;
  description: string;
  source: string;
  publishedDate: string;
};

export const mostReadItems: MostReadItem[] = [
  {
    rank: 1,
    title: "OpenAI unveils GPT-5",
    views: "18.4K views",
    slug: "openai-gpt5",
    image: "/images/article/gpt5-cover.jpg",
    category: "Technology",
    description:
      "OpenAI has officially announced GPT-5, introducing major improvements in reasoning, coding and multimodal understanding.",
    source: "OpenAI",
    publishedDate: "May 20, 2024",
  },
  {
    rank: 2,
    title: "NVIDIA breaks revenue record",
    views: "15.7K views",
    slug: "nvidia-breaks-revenue-record",
    image: "/images/news/ai-city.jpg",
    category: "Technology",
    description: "NVIDIA posts its strongest quarter yet, driven by soaring demand for AI data center chips.",
    source: "Bloomberg",
    publishedDate: "May 18, 2024",
  },
  {
    rank: 3,
    title: "Apple introduces AI Health",
    views: "13.2K views",
    slug: "apple-introduces-ai-health",
    image: "/images/news/apple.jpg",
    category: "Technology",
    description: "Apple unveils an AI-powered health companion that analyzes trends across all its devices.",
    source: "9to5Mac",
    publishedDate: "May 16, 2024",
  },
  {
    rank: 4,
    title: "SpaceX launches Starship Flight 5",
    views: "11.8K views",
    slug: "spacex-launches-starship-flight-5",
    image: "/images/news/funding.jpg",
    category: "World",
    description: "SpaceX successfully completes its fifth Starship test flight, a key milestone for deep space missions.",
    source: "Reuters",
    publishedDate: "May 14, 2024",
  },
  {
    rank: 5,
    title: "Microsoft invests $10B in AI",
    views: "10.1K views",
    slug: "microsoft-invests-10b-in-ai",
    image: "/images/news/gaming.jpg",
    category: "Business",
    description: "Microsoft commits another $10 billion to AI infrastructure, deepening its long-term AI strategy.",
    source: "CNBC",
    publishedDate: "May 11, 2024",
  },
];

/**
 * Formats a placeholder "views" figure from an article's `trendingScore`
 * for display alongside the curated (also placeholder) view counts
 * above - real view tracking depends on analytics infrastructure that
 * doesn't exist yet (see DESIGN.md), so this keeps live articles
 * visually consistent with the existing mock data rather than showing
 * "-- views" or omitting the figure.
 */
function formatViews(trendingScore: number): string {
  const estimated = Math.round(500 + trendingScore * 120);
  return estimated >= 1000 ? `${(estimated / 1000).toFixed(1)}K views` : `${estimated} views`;
}

/**
 * `mostReadItems` plus the highest-`trendingScore` live (RSS/API-sourced)
 * articles appended after them, deduped by slug and ranked continuing
 * from the curated list. `mostReadItems` itself stays untouched for
 * other consumers (e.g. `src/data/article.ts`'s fallback article lookup).
 */
export function getMostReadItems(limit = 8): MostReadItem[] {
  const existingSlugs = new Set(mostReadItems.map((item) => item.slug));

  const liveItems = getLiveArticlesSync()
    .filter((article) => !existingSlugs.has(article.slug))
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, Math.max(0, limit - mostReadItems.length))
    .map((article, index) => ({
      rank: mostReadItems.length + index + 1,
      title: article.title,
      views: formatViews(article.trendingScore),
      slug: article.slug,
      image: article.image,
      category: article.category,
      description: article.summary,
      source: article.source.name,
      publishedDate: formatPublishedDate(article.publishedAt),
    }));

  return [...mostReadItems, ...liveItems];
}
