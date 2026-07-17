import { classifyHttpStatus, fetchOgImage, fetchWithTimeout, pickBestImageUrl } from "@/lib/news";
import type { ImageCandidate } from "@/lib/news";
import { parseFeed } from "@/lib/news/xml-feed-parser";
import type { ParsedFeedItem } from "@/lib/news/xml-feed-parser";
import { FEED_SOURCES, type FeedSourceConfig } from "@/lib/news/feed-sources";
import type { NewsProviderId, ProviderNewsItem } from "@/types/news";
import type { NewsProvider } from "@/services/news/providers/news-provider.interface";

/** How long to wait for a single feed before giving up on it. */
const FEED_TIMEOUT_MS = 8000;

/**
 * Shared budget for how many items per feed get an OpenGraph image
 * lookup (`resolveBestImages` below) - each lookup is its own HTTP
 * request to the article's own page, so this bounds a single feed's
 * og:image cost to a fixed, predictable number of extra requests per
 * sync run instead of scraping every article a large feed might list.
 * Split across two priority tiers inside `resolveBestImages` (items
 * with no feed image at all, then items whose feed image has no
 * declared size) rather than one flat cutoff - see that function's doc
 * comment.
 */
const MAX_OG_LOOKUPS_PER_FEED = 20;

/**
 * Picks the best real image for every item in one feed, comparing the
 * feed's own image (`media:content`/`media:thumbnail`/`enclosure`/
 * inline `<img>` - see `xml-feed-parser.ts`) against the article page's
 * own og:image/twitter:image (`fetchOgImage`) instead of treating
 * og:image as a fallback used only when the feed gave nothing at all
 * ("og:image, twitter:image, RSS enclosure ve provider image arasında
 * en kaliteli görseli seçsin"). `pickBestImageUrl`
 * (`lib/news/image-fallback.ts`) makes the actual quality comparison
 * once both candidates (and their declared widths, when known) are in
 * hand.
 *
 * `MAX_OG_LOOKUPS_PER_FEED` is spent across two priority tiers so the
 * total og:image request cost per feed sync stays exactly as bounded
 * as before, just spent more usefully:
 *   1. Required - items with NO feed-supplied image at all. Without an
 *      og:image lookup these fall straight to the generic category
 *      placeholder, so they're served first out of the shared budget.
 *   2. Quality upgrade - items that DO have a feed image but with no
 *      declared width (a bare `<enclosure>` or inline `<img>` - real
 *      quality unknown), given a lookup with whatever budget tier 1
 *      didn't use, so a genuinely bigger og:image can still win.
 * Items whose feed image already declares a width (`media:content`/
 * `media:thumbnail`) skip the lookup entirely - a size-declared feed
 * image is trusted outright, the same way a browser trusts a `srcset`
 * candidate's declared width without downloading it first. Every
 * lookup in both tiers runs in parallel via `Promise.allSettled`, so
 * one slow/broken article page never delays the rest of the feed.
 *
 * Returns a `Map` keyed by `ParsedFeedItem.link` (a feed's items are
 * always distinct URLs) containing only the items an og:image lookup
 * actually improved on - callers fall back to the feed's own
 * `imageUrl` for every key not present in the returned map (including
 * every size-declared item, which never entered the lookup at all).
 */
async function resolveBestImages(items: ParsedFeedItem[]): Promise<Map<string, string>> {
  const withoutImage = items.filter((item) => !item.imageUrl);
  const withUnsizedImage = items.filter((item) => item.imageUrl && item.imageWidth === undefined);

  const required = withoutImage.slice(0, MAX_OG_LOOKUPS_PER_FEED);
  const remainingBudget = Math.max(0, MAX_OG_LOOKUPS_PER_FEED - required.length);
  const qualityUpgrade = withUnsizedImage.slice(0, remainingBudget);

  const ogTargets = [...required, ...qualityUpgrade];
  const results = new Map<string, string>();
  if (ogTargets.length === 0) return results;

  const ogResults = await Promise.allSettled(ogTargets.map((item) => fetchOgImage(item.link)));

  ogTargets.forEach((item, index) => {
    const outcome = ogResults[index];
    const og = outcome.status === "fulfilled" ? outcome.value : undefined;

    // Order matters here only when NEITHER candidate declares a width
    // (pickBestImageUrl's tie-break is "first candidate wins" in that
    // case) - og:image is listed first so it wins over an unsized
    // RSS <enclosure>/inline <img> when quality is otherwise unknown,
    // matching how xml-feed-parser.ts already ranks enclosure/inline
    // <img> as its own lowest-confidence sources.
    const candidates: ImageCandidate[] = [];
    if (og) candidates.push({ url: og.url, width: og.width });
    if (item.imageUrl) candidates.push({ url: item.imageUrl, width: item.imageWidth });

    const best = pickBestImageUrl(candidates);
    if (best) results.set(item.link, best);
  });

  return results;
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

    const bestImages = await resolveBestImages(items);

    return items.map((item) => ({
      title: item.title,
      summary: item.description ?? item.content ?? "",
      content: item.content,
      url: item.link,
      image: bestImages.get(item.link) ?? item.imageUrl,
      category: config.category,
      sourceId: config.sourceId,
      publishedAt: item.publishedAt,
    }));
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
