export type TrendingTopic = {
  rank: number;
  name: string;
  articleCount: string;
};

export const trendingTopics: TrendingTopic[] = [
  { rank: 1, name: "Artificial Intelligence", articleCount: "12.4K articles" },
  { rank: 2, name: "Cybersecurity", articleCount: "8.9K articles" },
  { rank: 3, name: "Space Exploration", articleCount: "7.2K articles" },
  { rank: 4, name: "Climate Change", articleCount: "6.8K articles" },
  { rank: 5, name: "Startups", articleCount: "5.3K articles" },
  { rank: 6, name: "Quantum Computing", articleCount: "5.1K articles" },
];
