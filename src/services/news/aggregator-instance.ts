import { env } from "@/lib/env";
import { NewsAggregator } from "@/services/news/news-aggregator";
import { ManualProvider } from "@/services/news/providers/manual-provider";
import { RSSProvider } from "@/services/news/providers/rss-provider";
import { NewsAPIProvider } from "@/services/news/providers/newsapi-provider";
import { GNewsProvider } from "@/services/news/providers/gnews-provider";

/**
 * Default, ready-to-use aggregator instance wired with every known
 * provider. `RSSProvider` only actively polls the feeds marked
 * `enabled: true` in `src/lib/news/feed-sources.ts`; `NewsAPIProvider`
 * and `GNewsProvider` no-op until their API keys are set (see
 * `.env.example`). None of that requires touching this file again —
 * enabling a feed or adding a key is enough.
 *
 * Kept in its own module (rather than inline in `index.ts`) so
 * `live-articles.ts` can import the singleton without creating a
 * circular dependency with the barrel file.
 */
export const newsAggregator = new NewsAggregator([
  new ManualProvider(),
  new RSSProvider(),
  new NewsAPIProvider(env.news.newsApiKey),
  new GNewsProvider(env.news.gNewsApiKey),
]);
