import { classifyHttpStatus, fetchOgImage, fetchWithTimeout } from "@/lib/news";
import { parseFeed } from "@/lib/news/xml-feed-parser";
import { FEED_SOURCES, type FeedSourceConfig } from "@/lib/news/feed-sources";
import type { NewsProviderId, ProviderNewsItem } from "@/types/news";
import type { NewsProvider } from "@/services/news/providers/news-provider.interface";

/** How long to wait for a single feed before giving up on it. */
const FEED_TIMEOUT_MS = 8000;

/**
 * Cap on how many items per feed get an OpenGraph image lookup when the
 * feed's own XML supplies none (no `media:content`/`media:thumbnail`/
 * `enclosure`/inline `<img>` - see `xml-feed-parser.ts`). Each lookup is
 * its own HTTP request to the article's own page, so this bounds a
 * single feed's og:image cost to a fixed, predictable number of extra
 * requests per sync run instead of scraping every article a large feed
 * might list.
 *
 * Raised from 10 to 20: with `FEED_SOURCES` currently at 10 enabled
 * feeds, a feed listing more than 10 image-less items per sync (common
 * for feeds whose RSS/Atom XML doesn't carry `media:*`/`enclosure`
 * tags at all) previously left every item past the cap on the generic
 * category placeholder even though a real og:image lookup was never
 * attempted for them. Doubling the cap doubles the worst-case og:image
 * requests for one feed (10 -> 20, run in parallel via
 * `Promise.allSettled` either way, so this doesn't add latency - only
 * request count) while staying a fixed, predictable bound rather than
 * scraping an entire feed.
 */
const MAX_OG_LOOKUPS_PER_FEED = 20;

/**
 * Fills in `image` for items the feed's XML didn't supply one for, via
 * `fetchOgImage` (last-resort OpenGraph fallback - Image Enrichment
 * phase, requirement 1). Bounded to `MAX_OG_LOOKUPS_PER_FEED` items and
 * run in parallel via `Promise.allSettled`, so one slow/broken article
 * page never delays the rest of the feed and a feed with many
 * image-less items never balloons into dozens of extra requests.
 */
async function enrichMissingImages(items: ProviderNewsItem[]): Promise<ProviderNewsItem[]> {
  const candidates = items.filter((item) => !item.image).slice(0, MAX_OG_LOOKUPS_PER_FEED);
  if (candidates.length === 0) return items;

  const results = await Promise.allSettled(candidates.map((item) => fetchOgImage(item.url)));

  const imageByUrl = new Map<string, string>();
  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      imageByUrl.set(candidates[index].url, result.value);
    }
  });
  if (imageByUrl.size === 0) return items;

  return items.map((item) => (item.image ? item : { ...item, image: imageByUrl.get(item.url) }));
}

async function fetchFeed(config: FeedSourceConfig): Promise<ProviderNewsItem[]> {
  try {
    const response = await fetchWithTimeout(
      config.url,
      { headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" } },
      FEED_TIMEOUT_MS
    );

    if (!response.ok) {
      const kind = classifyHttpStatus(response.status);
      console.error(`[RSSProvider] "${config.label}" returned ${kind} (HTTP ${response.status} ${response.statusText})`);
      return [];
    }

    const xml = await response.text();
    // A non-XML body (e.g. an HTML error/paywall page served with a 200
    // status) parses to zero items rather than throwing - `parseFeed` is
    // regex-based over `<item>`/`<entry>` blocks, so "no matches" is the
    // natural, safe outcome for invalid RSS instead of a crash.
    const items = parseFeed(xml);
    if (items.length === 0) {
      console.warn(`[RSSProvider] "${config.label}" returned no parseable items (invalid or empty feed).`);
    }

    const rawItems: ProviderNewsItem[] = items.map((item) => ({
      title: item.title,
      summary: item.description ?? item.content ?? "",
      content: item.content,
      url: item.link,
      image: item.imageUrl,
      category: config.category,
      sourceId: config.sourceId,
      publishedAt: item.publishedAt,
    }));

    return await enrichMissingImages(rawItems);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    // Expected, recoverable failure modes: DNS/network unavailable or a
    // request timeout (both raised as `ProviderHttpError` by
    // `fetchWithTimeout`). Logged for visibility; the caller treats this
    // feed as empty and continues with the others.
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
