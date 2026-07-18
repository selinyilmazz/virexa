/**
 * Static fallback shape, kept in sync with `TrendingCategoryStat`
 * (`services/articles/article-read-service.ts`) so `TrendingTopics.tsx`
 * can render this and the real, DB-backed data through the exact same
 * component with no conditional branches - only used when the database
 * has no articles yet (or a read error, already logged upstream).
 */
export type TrendingTopic = {
  rank: number;
  name: string;
  articleCount: string;
  icon: string;
  count: number;
  trendDirection: "up" | "down" | "flat" | "new";
  trendPercent: number;
  sparkline: number[];
  latestArticle: { slug: string; title: string; image: string } | null;
};

export const trendingTopics: TrendingTopic[] = [
  {
    rank: 1,
    name: "Artificial Intelligence",
    articleCount: "12.4K articles",
    icon: "🤖",
    count: 12400,
    trendDirection: "up",
    trendPercent: 18,
    sparkline: [4, 6, 5, 8, 9, 11, 14],
    latestArticle: null,
  },
  {
    rank: 2,
    name: "Cybersecurity",
    articleCount: "8.9K articles",
    icon: "🔒",
    count: 8900,
    trendDirection: "up",
    trendPercent: 9,
    sparkline: [5, 5, 6, 7, 6, 8, 9],
    latestArticle: null,
  },
  {
    rank: 3,
    name: "Space Exploration",
    articleCount: "7.2K articles",
    icon: "🛰️",
    count: 7200,
    trendDirection: "flat",
    trendPercent: 0,
    sparkline: [6, 7, 6, 7, 7, 6, 7],
    latestArticle: null,
  },
  {
    rank: 4,
    name: "Climate Change",
    articleCount: "6.8K articles",
    icon: "🌍",
    count: 6800,
    trendDirection: "down",
    trendPercent: 6,
    sparkline: [8, 7, 8, 7, 6, 6, 5],
    latestArticle: null,
  },
  {
    rank: 5,
    name: "Startups",
    articleCount: "5.3K articles",
    icon: "🚀",
    count: 5300,
    trendDirection: "up",
    trendPercent: 22,
    sparkline: [3, 4, 4, 5, 6, 7, 9],
    latestArticle: null,
  },
  {
    rank: 6,
    name: "Quantum Computing",
    articleCount: "5.1K articles",
    icon: "🔬",
    count: 5100,
    trendDirection: "new",
    trendPercent: 0,
    sparkline: [0, 0, 1, 1, 2, 3, 4],
    latestArticle: null,
  },
];
