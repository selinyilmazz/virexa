import { parseFeed } from "@/lib/news/xml-feed-parser";
import { FEED_SOURCES, type FeedSourceConfig } from "@/lib/news/feed-sources";
import type { NewsProviderId, ProviderNewsItem } from "@/types/news";
import type { NewsProvider } from "@/services/news/providers/news-provider.interface";

/** How long to wait for a single feed before giving up on it. */
const FEED_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFeed(config: FeedSourceConfig): Promise<ProviderNewsItem[]> {
  try {
    const xml = await fetchWithTimeout(config.url, FEED_TIMEOUT_MS);
    const items = parseFeed(xml);

    return items.map((item) => ({
      title: item.title,
      summary: item.description ?? item.content ?? "",
      content: item.content,
      url: item.link,
      image: item.imageUrl,
      category: config.category,
      sourceId: config.sourceId,
      publishedAt: item.publishedAt,
    }));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    // Expected, recoverable failure modes: DNS/network unavailable, feed
    // timeout, or a non-2xx response. Logged for visibility; the caller
    // treats this feed as empty and continues with the others.
    console.error(`[RSSProvider] Failed to fetch "${config.label}" (${config.url}): ${reason}`);
    return [];
  }
}

/**
 * Reads articles from the RSS/Atom feeds registered in
 * src/lib/news/feed-sources.ts. Each feed is fetched independently
 * with its own timeout; a failure on one feed (network down, timeout,
 * non-2xx response, malformed XML) never affects the others - it's
 * logged and simply contributes zero articles for that source.
 */
export class RSSProvider implements NewsProvider {
  readonly id: NewsProviderId = "rss";
  readonly name = "RSS";

  constructor(private readonly feeds: FeedSourceConfig[] = FEED_SOURCES) {}

  async fetchArticles(): Promise<ProviderNewsItem[]> {
    const enabledFeeds = this.feeds.filter((feed) => feed.enabled);
    if (enabledFeeds.length === 0) {
      return [];
    }

    const results = await Promise.allSettled(enabledFeeds.map((feed) => fetchFeed(feed)));

    const items: ProviderNewsItem[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        items.push(...result.value);
      } else {
        // fetchFeed already catches its own errors and resolves to [], so
        // this branch only fires for truly unexpected failures.
        console.error(`[RSSProvider] Unexpected failure reading "${enabledFeeds[index].label}":`, result.reason);
      }
    });

    return items;
  }
}
