export type { NewsProvider } from "@/services/news/providers/news-provider.interface";
export { NewsAggregator } from "@/services/news/news-aggregator";
export { ManualProvider } from "@/services/news/providers/manual-provider";
export { RSSProvider } from "@/services/news/providers/rss-provider";
export { NewsAPIProvider } from "@/services/news/providers/newsapi-provider";
export { GNewsProvider } from "@/services/news/providers/gnews-provider";
export { newsAggregator } from "@/services/news/aggregator-instance";
export { getLiveArticlesSync } from "@/services/news/live-articles";
