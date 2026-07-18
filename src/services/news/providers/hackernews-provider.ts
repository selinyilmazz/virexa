import { classifyHttpStatus, fetchOgImage, fetchWithTimeout } from "@/lib/news";
import type { Author, FetchArticlesParams, NewsProviderId, ProviderNewsItem } from "@/types/news";
import type { NewsProvider } from "@/services/news/providers/news-provider.interface";

const REQUEST_TIMEOUT_MS = 8000;
const BASE_URL = "https://hacker-news.firebaseio.com/v0";

/**
 * The three HN story listings this provider supports ("Top Stories,
 * Best Stories, New Stories"). Mirrors the `FEED_SOURCES`
 * enabled/disabled registry pattern from `lib/news/feed-sources.ts` -
 * each entry can be independently toggled without touching the fetch
 * logic below.
 */
type HackerNewsStoryType = "topstories" | "beststories" | "newstories";

type HackerNewsListing = {
  type: HackerNewsStoryType;
  label: string;
  enabled: boolean;
};

const HN_LISTINGS: HackerNewsListing[] = [
  { type: "topstories", label: "Top Stories", enabled: true },
  { type: "beststories", label: "Best Stories", enabled: true },
  { type: "newstories", label: "New Stories", enabled: true },
];

/**
 * How many ids to take off the FRONT of each listing before fetching
 * item details - the Firebase API has no bulk-item endpoint, so every
 * story is its own HTTP request. Capping per-listing (rather than
 * fetching all ~500 ids per type) keeps a single sync run to at most
 * `HN_LISTINGS.length * ITEMS_PER_LISTING` item requests (60 today),
 * run in parallel - a deliberate, documented tradeoff between coverage
 * and not hammering a free public API on every scheduled run.
 */
const ITEMS_PER_LISTING = 20;

/** Raw shape of a Hacker News `item` - see https://github.com/HackerNews/API#items. Only `story`-type items are ever turned into articles (see `toProviderItem`); comments/polls/pollopts/jobs are filtered out. */
type HackerNewsItem = {
  id: number;
  deleted?: boolean;
  type?: string;
  by?: string;
  time?: number;
  text?: string;
  dead?: boolean;
  url?: string;
  score?: number;
  title?: string;
  descendants?: number;
};

async function fetchJson<T>(url: string): Promise<T | undefined> {
  try {
    const response = await fetchWithTimeout(url, {}, REQUEST_TIMEOUT_MS);
    if (!response.ok) {
      const kind = classifyHttpStatus(response.status);
      console.error(`[HackerNewsProvider] Request failed (${kind}, HTTP ${response.status}): ${url}`);
      return undefined;
    }
    return (await response.json()) as T;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[HackerNewsProvider] Failed to fetch ${url}: ${reason}`);
    return undefined;
  }
}

/** Strips the small set of inline tags HN's own `text` field actually uses (`<p>`, `<a>`, `<i>`, `<code>`, ...) down to plain text - HN self-post text is simple, hand-authored HTML, not arbitrary markup, so a lightweight regex strip (not a full HTML parser dependency) is sufficient here. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDomain(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/**
 * Builds a human-readable summary for items that have no provider
 * description (most HN link-posts don't - HN only stores a title +
 * destination URL, not an excerpt). Falls back to the item's own
 * self-text (Ask HN / Show HN posts) when present. Always non-empty,
 * so Full-Text Search's "Description" field has something meaningful
 * to index for every Hacker News article, not just self-posts.
 */
function buildSummary(item: HackerNewsItem, domain: string | undefined): string {
  if (item.text) {
    return stripHtml(item.text);
  }
  const points = item.score ?? 0;
  const comments = item.descendants ?? 0;
  const parts = [`${points} point${points === 1 ? "" : "s"}`, `${comments} comment${comments === 1 ? "" : "s"}`, "on Hacker News"];
  if (domain) parts.push(`· ${domain}`);
  return parts.join(" ");
}

/** "Ask HN"/"Show HN" titles get a matching tag - genuinely useful for Full-Text Search's tag matching and for anyone scanning the Sources/Articles admin list, at zero extra API cost (derived purely from the title HN already gives us). */
function deriveTags(title: string): string[] {
  const tags: string[] = [];
  if (/^ask hn:/i.test(title)) tags.push("Ask HN");
  if (/^show hn:/i.test(title)) tags.push("Show HN");
  return tags;
}

function toProviderItem(item: HackerNewsItem, image: string | undefined): ProviderNewsItem | undefined {
  if (item.deleted || item.dead) return undefined;
  if (item.type !== "story") return undefined;
  if (!item.title || !item.time) return undefined;

  // Self-posts (Ask HN, most Show HN, polls-as-stories) have no `url` -
  // the story's own HN discussion page is the only valid destination.
  const url = item.url ?? `https://news.ycombinator.com/item?id=${item.id}`;
  const domain = extractDomain(item.url);

  // Every HN story - self-post or link-post alike - has a permanent
  // discussion page at this URL. Unlike `url` above (which for a
  // link-post points at whatever external site the story links to -
  // occasionally a Reddit thread, which is what was previously getting
  // shown as "the Hacker News link" since `url` was the only field this
  // provider populated), `discussionUrl` always, unconditionally points
  // at Hacker News itself. See `NewsArticle.discussionUrl`'s doc comment
  // for how the read layer uses this.
  const discussionUrl = `https://news.ycombinator.com/item?id=${item.id}`;

  const author: Author | undefined = item.by ? { name: item.by } : undefined;

  return {
    title: item.title,
    summary: buildSummary(item, domain),
    content: item.text ? stripHtml(item.text) : undefined,
    url,
    discussionUrl,
    image,
    category: "Technology",
    tags: deriveTags(item.title),
    author,
    sourceId: "hacker-news",
    publishedAt: new Date(item.time * 1000).toISOString(),
    engagementScore: item.score,
  };
}

/**
 * Looks up each story's OpenGraph preview image via `fetchOgImage`
 * (Image Enrichment phase, requirement 1) - the HN API itself never
 * returns an image field, only a title + destination URL, so this is
 * the only way a Hacker News article ever gets a real cover image
 * instead of falling back to the generic Technology placeholder. Only
 * attempted for items with a genuine external `url` (self-posts whose
 * only destination is HN's own discussion page have no article page to
 * scrape); run in parallel via `Promise.allSettled` so one slow/broken
 * page's lookup never delays the others.
 */
async function fetchOgImagesById(items: HackerNewsItem[]): Promise<Map<number, string>> {
  const candidates = items.filter(
    (item) => !item.deleted && !item.dead && item.type === "story" && item.url
  );
  if (candidates.length === 0) return new Map();

  const results = await Promise.allSettled(candidates.map((item) => fetchOgImage(item.url as string)));

  const imageById = new Map<number, string>();
  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      imageById.set(candidates[index].id, result.value.url);
    }
  });
  return imageById;
}

/**
 * Integrates with the official Hacker News API
 * (https://github.com/HackerNews/API) - a free, public, unauthenticated
 * Firebase-backed REST API, so unlike `NewsAPIProvider`/`GNewsProvider`
 * this provider needs no API key and is always "configured" (mirrors
 * `RSSProvider` in that respect).
 *
 * Fetches the id lists for Top/Best/New Stories in parallel, takes the
 * front `ITEMS_PER_LISTING` ids from each, de-duplicates the combined id
 * set (the three listings overlap heavily), then fetches each item's
 * details in parallel via `Promise.allSettled` - one failing item fetch
 * never drops the rest. Every `hacker-news`-sourced article carries the
 * SAME `sourceId` ("hacker-news") regardless of which external site the
 * story links to - HN is the distributing source of record here, the
 * same way a wire service is credited even when its stories run in many
 * outlets elsewhere. `engagementScore` (HN's own point score) rides
 * along on every item so it can feed into trending-score calculation
 * (see `lib/news/trending-score.ts`).
 *
 * Same "never throws" contract as every other provider: any failure
 * (network, timeout, malformed response, an individual item request
 * failing) is caught, logged, and simply omits that item/listing rather
 * than rejecting the whole call.
 */
export class HackerNewsProvider implements NewsProvider {
  readonly id: NewsProviderId = "hn";
  readonly name = "Hacker News";

  async fetchArticles(params?: FetchArticlesParams): Promise<ProviderNewsItem[]> {
    try {
      const enabledListings = HN_LISTINGS.filter((listing) => listing.enabled);

      const listingResults = await Promise.allSettled(
        enabledListings.map((listing) => fetchJson<number[]>(`${BASE_URL}/${listing.type}.json`))
      );

      const idSet = new Set<number>();
      listingResults.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          result.value.slice(0, ITEMS_PER_LISTING).forEach((id) => idSet.add(id));
        } else if (result.status === "rejected") {
          console.error(`[HackerNewsProvider] Listing "${enabledListings[index].type}" failed:`, result.reason);
        }
      });

      if (idSet.size === 0) return [];

      const itemResults = await Promise.allSettled(
        [...idSet].map((id) => fetchJson<HackerNewsItem>(`${BASE_URL}/item/${id}.json`))
      );

      const items = itemResults
        .filter((result): result is PromiseFulfilledResult<HackerNewsItem | undefined> => result.status === "fulfilled")
        .map((result) => result.value)
        .filter((item): item is HackerNewsItem => item !== undefined);

      const imageById = await fetchOgImagesById(items);

      const providerItems = items
        .map((item) => toProviderItem(item, imageById.get(item.id)))
        .filter((item): item is ProviderNewsItem => item !== undefined)
        // Freshest first, matching every other provider's own natural order.
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      const limit = params?.limit;
      return limit && limit > 0 ? providerItems.slice(0, limit) : providerItems;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`[HackerNewsProvider] Failed to fetch articles: ${reason}`);
      return [];
    }
  }
}
