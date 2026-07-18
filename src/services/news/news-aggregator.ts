import {
  calculateTrendingScore,
  dedupeArticles,
  estimateReadingTime,
  fetchArticleContent,
  getSourceById,
  getSourceLogo,
  inferCategoryFromTitle,
  isAcceptableImageUrl,
  makeUniqueSlug,
  MIN_ACCEPTABLE_CONTENT_LENGTH,
  normalizeCategory,
  resolveFallbackImageForCategory,
  resolveTrustScore,
  searchStockImage,
  slugify,
  buildArticleId,
} from "@/lib/news";
import type { FetchArticlesParams, NewsArticle, ProviderNewsItem } from "@/types/news";
import type { NewsProvider } from "@/services/news/providers/news-provider.interface";

/**
 * Cap on how many articles get a stock-photo search (stage 3) in one
 * `fetchArticles()` call - bounds API cost/rate-limit exposure the same
 * way `MAX_OG_LOOKUPS_PER_FEED` bounds `RSSProvider`'s og:image lookups.
 * Every article beyond this cap that's still missing an image simply
 * falls straight to the stage-5 local placeholder for this run.
 *
 * Same amortized-cost tradeoff `RSSProvider`'s og:image lookups already
 * accept: a still-imageless item that stays in a feed's own listing
 * across several pipeline runs gets searched again on each of those
 * runs (this stage has no "already tried this exact article" memory of
 * its own - `NewsAggregator` is storage-agnostic, used by both the
 * persisted pipeline and the in-memory live-articles cache, so it can't
 * check the database without breaking that separation). In practice
 * this is naturally bounded, not unbounded: RSS/HN feeds only list a
 * fixed, small window of recent items, so an item stops being
 * re-fetched (and re-searched) at all once it ages out of its feed's
 * own listing - typically within a day, not indefinitely.
 */
const MAX_STOCK_IMAGE_LOOKUPS_PER_RUN = 40;

/**
 * Cap on how many articles get a full-content extraction attempt (stage
 * "content resolution", sibling to `resolveMissingImages` below) in one
 * `fetchArticles()` call - same amortized-cost/budget shape as
 * `MAX_STOCK_IMAGE_LOOKUPS_PER_RUN`, just lower, since this stage does a
 * full page fetch + HTML scan (`fetchArticleContent`) rather than a
 * single API lookup. Articles beyond this cap that are still thin simply
 * keep their provider-supplied `content`/`summary` for this run;
 * `article-read-service.ts`'s `buildContentBlocks` has its own further
 * fallback (description + AI summary) for whatever is still thin by the
 * time a reader opens the article.
 */
const MAX_CONTENT_EXTRACTIONS_PER_RUN = 15;

/**
 * Normalizes one raw provider item into the final `NewsArticle` shape:
 * resolves its source, maps its free-text category into the fixed
 * taxonomy, fills in a fallback image when none was supplied, defaults
 * language/country from the source when the provider didn't specify
 * them, derives a slug (uniqueness against sibling articles is enforced
 * by the caller via `usedSlugs`), and stamps the enrichment fields every
 * article is guaranteed to have: `sourceLogo`, `readingTime`,
 * `trustScore`, `trendingScore`. Items whose `sourceId` isn't in the
 * source registry are dropped with a warning rather than crashing the
 * whole aggregation run - an unknown source means the item can't be
 * trusted or displayed correctly yet.
 *
 * Category resolution prefers `inferCategoryFromTitle(item.title)` (a
 * real content signal) over `normalizeCategory(item.category)` (the
 * feed/provider's own static, often overly-broad label - see
 * `category-mapper.ts`'s doc comment on why every RSS feed is otherwise
 * permanently stuck as "Technology" or "AI"). Falls back to
 * `normalizeCategory(item.category)` unchanged whenever the title gives
 * no confident signal, so a provider that already supplies a real,
 * specific category is never second-guessed away from it for no reason.
 *
 * `item.engagementScore` (e.g. Hacker News points), when present, is
 * both carried onto the resulting `NewsArticle` unchanged AND blended
 * into the initial `trendingScore` via `TrendingSignals` - see
 * `lib/news/trending-score.ts`.
 */
function normalizeProviderItem(
  item: ProviderNewsItem,
  fetchedAt: string,
  usedSlugs: Set<string>
): NewsArticle | undefined {
  const source = getSourceById(item.sourceId);
  if (!source) {
    console.warn(`[NewsAggregator] Skipping article from unknown source "${item.sourceId}": ${item.title}`);
    return undefined;
  }

  const category = inferCategoryFromTitle(item.title) ?? normalizeCategory(item.category);
  const slug = makeUniqueSlug(slugify(item.title), usedSlugs);
  const trustScore = resolveTrustScore(source);

  // Image resolution happens in two passes: an acceptable candidate the
  // PROVIDER itself already supplied (a raw RSS feed image, NewsAPI's
  // `urlToImage`, GNews's `image`, or an og:image already merged in
  // upstream by that provider's own enrichment - `RSSProvider`'s
  // `resolveBestImages`, `HackerNewsProvider`'s `fetchOgImagesById`) is
  // kept here immediately; anything still missing is left as `""` (NOT
  // the category placeholder yet) so `fetchArticles()` below can batch a
  // stock-photo search for exactly those articles before anything falls
  // back to a local placeholder - see that function's doc comment.
  const hasAcceptableImage = isAcceptableImageUrl(item.image);

  return {
    id: buildArticleId(source.id, slug),
    slug,
    title: item.title,
    summary: item.summary,
    content: item.content,
    url: item.url,
    discussionUrl: item.discussionUrl,
    image: hasAcceptableImage ? (item.image as string) : "",
    imageSource: hasAcceptableImage ? "provider" : "",
    category,
    tags: item.tags ?? [],
    author: item.author,
    source,
    publishedAt: item.publishedAt,
    fetchedAt,
    language: item.language ?? source.language,
    country: item.country ?? source.country,
    sourceLogo: getSourceLogo(source),
    readingTime: estimateReadingTime(item.content, item.summary),
    trustScore,
    trendingScore: calculateTrendingScore({
      publishedAt: item.publishedAt,
      trustScore,
      source,
      signals: item.engagementScore !== undefined ? { engagementScore: item.engagementScore } : undefined,
    }),
    engagementScore: item.engagementScore,
  };
}

/**
 * Aggregates articles across every registered `NewsProvider`, normalizes
 * them into `NewsArticle`, removes duplicates, and returns them sorted by
 * recency. This is the only entry point UI or API code should use for
 * reading news — nothing outside this file should talk to a provider
 * directly (see DESIGN.md → "News Architecture").
 *
 * Provider failures are isolated: if one provider's `fetchArticles` call
 * rejects, its articles are simply omitted and the rest of the pipeline
 * continues.
 */
export class NewsAggregator {
  constructor(private readonly providers: NewsProvider[]) {}

  async fetchArticles(params?: FetchArticlesParams): Promise<NewsArticle[]> {
    const fetchedAt = new Date().toISOString();

    const results = await Promise.allSettled(this.providers.map((provider) => provider.fetchArticles(params)));

    const rawItems: ProviderNewsItem[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        rawItems.push(...result.value);
      } else {
        const provider = this.providers[index];
        console.error(`[NewsAggregator] Provider "${provider.id}" failed:`, result.reason);
      }
    });

    const usedSlugs = new Set<string>();
    const normalized = rawItems
      .map((item) => normalizeProviderItem(item, fetchedAt, usedSlugs))
      .filter((article): article is NewsArticle => article !== undefined);

    // Dedupe with the highest-trust copy of a story kept preferentially
    // (see `dedupeArticles` in duplicate-detector.ts), then present
    // newest-first regardless of which provider/order things arrived in.
    const bestFirst = [...normalized].sort((a, b) => b.trustScore - a.trustScore);
    const deduped = dedupeArticles(bestFirst);

    // Image resolution, stages 3-5 (stages 1-2 - the provider's own feed/
    // API image and any upstream og:image lookup - already happened
    // in normalizeProviderItem above). Deliberately run AFTER dedupe, not
    // before, so a duplicate copy of the same story never burns its own
    // stock-photo search budget - only the one surviving copy does.
    const withImages = await resolveMissingImages(deduped);

    // Content resolution (product polishing phase, 2nd pass, area 8:
    // "haber detay sayfasını güçlendir"). Also run after dedupe, for the
    // same reason images are: no point burning an extraction fetch on a
    // duplicate copy of a story that's about to be dropped.
    const withContent = await resolveMissingContent(withImages);

    return withContent.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }
}

/**
 * Image resolution, stages 3-5: for every article that still has no
 * acceptable image after stages 1-2 (`article.image === ""`, set that way
 * by `normalizeProviderItem` above), tries a real, topically-relevant,
 * royalty-free stock photo search (stage 3 - `searchStockImage`, tried
 * for at most `MAX_STOCK_IMAGE_LOOKUPS_PER_RUN` articles per call, run in
 * parallel via `Promise.allSettled` so one slow/broken lookup never
 * delays the rest), then falls back to a local, category-specific SVG
 * placeholder (stage 5 - `resolveFallbackImageForCategory`, a total
 * function that can never itself fail) for anything still missing after
 * that - either because the stock search itself found nothing, or the
 * article was beyond this run's lookup budget.
 *
 * Runs once per `fetchArticles()` call - i.e. once per ingestion pass,
 * never per page view (see `searchStockImage`'s own doc comment) - and
 * every article this function returns leaves it with `image` set to a
 * real, renderable URL and `imageSource` recording which stage supplied
 * it, for both the persisted pipeline (`runtime/pipeline/steps/
 * database-step.ts` writes `imageSource` straight to
 * `articles.image_source`) and the in-memory live-articles cache.
 */
async function resolveMissingImages(articles: NewsArticle[]): Promise<NewsArticle[]> {
  const missing = articles.filter((article) => !article.image);
  const candidates = missing.slice(0, MAX_STOCK_IMAGE_LOOKUPS_PER_RUN);

  const stockResultById = new Map<string, { url: string; imageSource: string }>();

  if (candidates.length > 0) {
    const results = await Promise.allSettled(
      candidates.map((article) => searchStockImage(article.title, article.category))
    );

    results.forEach((result, index) => {
      const article = candidates[index];
      if (result.status === "fulfilled" && result.value) {
        stockResultById.set(article.id, {
          url: result.value.url,
          imageSource: `stock:${result.value.provider}`,
        });
      } else if (result.status === "rejected") {
        console.error(`[NewsAggregator] Stock image search failed for "${article.title}":`, result.reason);
      }
    });
  }

  return articles.map((article) => {
    if (article.image) return article;

    const stock = stockResultById.get(article.id);
    if (stock) return { ...article, image: stock.url, imageSource: stock.imageSource };

    // Stage 5, last resort: a local category placeholder. Total
    // function, always succeeds, so every article this map produces is
    // guaranteed to have a real, renderable `image`.
    return { ...article, image: resolveFallbackImageForCategory(article.category), imageSource: "placeholder" };
  });
}

/**
 * Attempts real full-article-text extraction (`fetchArticleContent`) for
 * articles whose provider-supplied `content` is missing or too thin to
 * actually read (product polishing phase, 2nd pass, area 8 - most RSS/
 * API providers only ever supply a short blurb, not the real body).
 * Bounded to `MAX_CONTENT_EXTRACTIONS_PER_RUN` candidates per call, run
 * in parallel via `Promise.allSettled` so one slow/broken article page
 * never delays the rest - the same shape as `resolveMissingImages`
 * above. Articles whose extraction fails or is skipped for budget
 * reasons simply keep whatever `content` they already had; nothing here
 * ever regresses an article to less content than it started with.
 */
async function resolveMissingContent(articles: NewsArticle[]): Promise<NewsArticle[]> {
  const thin = articles.filter((article) => !article.content || article.content.trim().length < MIN_ACCEPTABLE_CONTENT_LENGTH);
  const candidates = thin.slice(0, MAX_CONTENT_EXTRACTIONS_PER_RUN);

  const extractedById = new Map<string, string>();

  if (candidates.length > 0) {
    const results = await Promise.allSettled(candidates.map((article) => fetchArticleContent(article.url)));

    results.forEach((result, index) => {
      const article = candidates[index];
      if (result.status === "fulfilled" && result.value) {
        extractedById.set(article.id, result.value);
      } else if (result.status === "rejected") {
        console.error(`[NewsAggregator] Content extraction failed for "${article.title}":`, result.reason);
      }
    });
  }

  return articles.map((article) => {
    const extracted = extractedById.get(article.id);
    return extracted ? { ...article, content: extracted } : article;
  });
}
