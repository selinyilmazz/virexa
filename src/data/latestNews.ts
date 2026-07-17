import type { CategoryNewsItem } from "@/data/categories";
import { toCategoryNewsItem } from "@/lib/news";
import { getLiveArticlesSync } from "@/services/news";

export const latestNewsItems: CategoryNewsItem[] = [
  {
    slug: "ai-revolutionizes-city-transportation-systems",
    image: "/images/news/ai-city.jpg",
    category: "Technology",
    title: "AI Revolutionizes City Transportation Systems",
    description: "New AI-powered traffic management systems reduce congestion by 40% in major cities.",
    source: "TechCrunch",
    publishedDate: "May 20, 2024",
    isBookmarked: false,
  },
  {
    slug: "next-generation-gaming-takes-center-stage",
    image: "/images/news/gaming.jpg",
    category: "Games",
    title: "Next-Generation Gaming Takes Center Stage",
    description: "Studios showcase new worlds and advanced gameplay experiences for players.",
    source: "GameSpot",
    publishedDate: "May 19, 2024",
    isBookmarked: true,
  },
  {
    slug: "apple-reports-record-quarterly-revenue",
    image: "/images/news/apple.jpg",
    category: "Business",
    title: "Apple Reports Record Quarterly Revenue",
    description: "Strong iPhone sales and AI services drive the company's highest quarterly earnings to date.",
    source: "Reuters",
    publishedDate: "May 17, 2024",
    isBookmarked: false,
  },
  {
    slug: "anthropic-raises-26-billion-in-funding",
    image: "/images/news/funding.jpg",
    category: "AI",
    title: "Anthropic Raises $2.6 Billion in Funding",
    description: "The investment will accelerate AI research and strengthen competition in the generative AI market.",
    source: "TechCrunch",
    publishedDate: "May 12, 2024",
    isBookmarked: false,
  },
];

/**
 * `latestNewsItems` plus any live (RSS/API-sourced) articles, deduped by
 * slug - same merge pattern as `getCategoryBySlug` in
 * `src/data/categories.ts`. `latestNewsItems` itself stays untouched for
 * other consumers (e.g. `src/data/article.ts`'s fallback article lookup)
 * that specifically want the curated-only list. Bounded to `limit` so
 * the Home page grid doesn't grow unbounded once real feeds are live.
 */
export function getLatestNewsItems(limit = 8): CategoryNewsItem[] {
  const existingSlugs = new Set(latestNewsItems.map((item) => item.slug));
  const liveItems = getLiveArticlesSync()
    .filter((article) => !existingSlugs.has(article.slug))
    .map(toCategoryNewsItem);

  return [...latestNewsItems, ...liveItems].slice(0, limit);
}
