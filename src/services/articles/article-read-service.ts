import { cache } from "react";
import { categories as categoryTaxonomy } from "@/data/categories";
import type { CategoryNewsItem } from "@/data/categories";
import type { ArticleContentBlock } from "@/data/article";
import { RESOURCE_SEARCH_TERMS, WATCHED_RELEASES } from "@/data/homepage-widgets";
import type { WatchedRelease } from "@/data/homepage-widgets";
import {
  estimateReadingTime,
  formatPublishedDate,
  getSourceById,
  getSourceLogo,
  MIN_ACCEPTABLE_CONTENT_LENGTH,
  resolveArticleImage,
  searchStockImage,
  SEARCH_CATEGORY_SLUGS,
  splitIntoParagraphs,
} from "@/lib/news";
import { createClient } from "@/lib/supabase/server";
import { createArticleAIRepository } from "@/repositories/article-ai-repository";
import { createArticleMetricsRepository } from "@/repositories/article-metrics-repository";
import { createArticleRepository } from "@/repositories/article-repository";
import { createSourceRepository } from "@/repositories/source-repository";
import type { FullTextSearchParams } from "@/lib/validation/article-storage-schema";
import type {
  ArticleRow,
  StoredArticleRewrite,
  StoredBias,
  StoredEntities,
  StoredKeyTakeaways,
  StoredLongSummary,
  StoredSentiment,
  StoredTldr,
} from "@/types/database";
import type { Category as NewsCategory } from "@/types/news";

/** Category name -> emoji icon, reusing `src/data/categories.ts`'s existing taxonomy (already has one per category for the `/category/[slug]` pages) instead of maintaining a second copy just for the homepage's Trending Topics widget. */
const CATEGORY_ICON_BY_NAME = new Map(categoryTaxonomy.map((category) => [category.name, category.icon]));

/**
 * Server-only read access to the Article Storage tables
 * (`supabase/migrations/0002_article_storage.sql`) for every UI surface
 * that displays real articles (Home, Categories, Search, Article
 * Detail). This is the ONLY place page/Server-Component code should
 * call the article/AI/metrics repositories from for reads - mirrors the
 * existing "components never call a provider/repository directly"
 * convention from the News and AI layers.
 *
 * Every exported function here:
 *  - never throws - a Supabase/repository failure is caught, logged,
 *    and turned into an empty/`null` result so a page can always render
 *    a graceful fallback instead of crashing ("Repository hata verirse
 *    UI çökmeyecek").
 *  - uses the request-scoped, RLS-respecting server client
 *    (`lib/supabase/server.ts`) - reads are public per the Article
 *    Storage RLS policies, so no service-role client is needed here
 *    (that's reserved for writes - see `article-metrics-service.ts`).
 */

const getRepositories = cache(async () => {
  const supabase = await createClient();
  return {
    articles: createArticleRepository(supabase),
    ai: createArticleAIRepository(supabase),
    metrics: createArticleMetricsRepository(supabase),
    sources: createSourceRepository(supabase),
  };
});

const VALID_CATEGORIES = new Set<NewsCategory>([
  "Technology",
  "Business",
  "AI",
  "Games",
  "Mobile Games",
  "World",
  "Science",
  "Security",
  "Startup",
  "Programming",
  "Mobile",
  "Robotics",
  "Space",
]);

function resolveDisplayImage(row: Pick<ArticleRow, "image_url" | "category">): string {
  if (row.image_url && row.image_url.trim().length > 0) {
    return row.image_url;
  }
  const category = VALID_CATEGORIES.has(row.category as NewsCategory) ? (row.category as NewsCategory) : "Technology";
  return resolveArticleImage(undefined, category);
}

function resolveSourceName(sourceId: string): string {
  return getSourceById(sourceId)?.name ?? sourceId;
}

/** Real source logo (or the shared default badge) for a stored article's `source_id` - used by the "Resources & Career Hub" widget, whose rows are real DB articles rather than a curated logo set (see `getResourcesNews()`). */
function resolveSourceLogo(sourceId: string): string {
  return getSourceLogo({ logo: getSourceById(sourceId)?.logo });
}

/** Adapts an `ArticleRow` into the `CategoryNewsItem` shape every existing card component (`NewsCard`, category grids, search results) already renders - the DB-backed counterpart to `lib/news/ui-adapter.ts`'s `toCategoryNewsItem` (which adapts the in-memory `NewsArticle` shape instead). */
function toCategoryNewsItem(row: ArticleRow): CategoryNewsItem {
  return {
    slug: row.slug,
    image: resolveDisplayImage(row),
    category: row.category,
    title: row.title,
    description: row.description,
    source: resolveSourceName(row.source_id),
    publishedDate: formatPublishedDate(row.published_at),
    isBookmarked: false,
    // `row.reading_time` is stamped once at ingestion (minutes) - fine
    // for a list/card preview's "N min read" badge. The article detail
    // page recomputes this from the final resolved content instead (see
    // `getArticleDetail`) since that value needs to stay accurate for a
    // single article read end-to-end; a list card doesn't need that
    // precision, just a fast, honest ballpark.
    readingTime: `${row.reading_time} min read`,
  };
}

export type ArticlesPage = {
  items: CategoryNewsItem[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

function emptyPage(page: number, pageSize: number): ArticlesPage {
  return { items: [], total: 0, totalPages: 1, page, pageSize };
}

/**
 * Latest articles, most recently published first - backs Home's "Latest
 * News" section. `excludeSlug` (product polishing phase, area 5 -
 * "Avoid repeating the same articles everywhere") lets the caller drop
 * the Hero/Featured article from this list, since the single newest
 * article is very often also the current highest-trending one and
 * would otherwise show up twice on the homepage. Matched on `slug`
 * (not `id`) since that's what `FeaturedArticle`/`CategoryNewsItem`
 * actually carries - both are unique per article. Over-fetches by one
 * extra row specifically to absorb that exclusion without silently
 * returning fewer than `limit` items on the common case where the
 * excluded article really was in the newest page.
 */
export async function getLatestArticles(limit = 8, excludeSlug?: string): Promise<CategoryNewsItem[]> {
  try {
    const { articles } = await getRepositories();
    const result = await articles.search({ page: 1, pageSize: excludeSlug ? limit + 1 : limit });
    const items = excludeSlug ? result.items.filter((row) => row.slug !== excludeSlug) : result.items;
    return items.slice(0, limit).map(toCategoryNewsItem);
  } catch (error) {
    console.error("[article-read-service] getLatestArticles failed:", error);
    return [];
  }
}

export type FeaturedArticle = CategoryNewsItem & { hasAIInsights: boolean };

/** Bounds the Hero's on-demand stock-photo lookup below (product polishing phase, area 1) so a slow/unresponsive provider chain can never hold up the whole homepage render - the Hero still renders with its existing (placeholder) image on timeout, same as if the search had simply found nothing. */
const HERO_IMAGE_SEARCH_TIMEOUT_MS = 6000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([promise, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))]);
}

/**
 * The single highest-`trending_score` article, flagged with whether it
 * already has AI enrichment (`article_ai`) - backs Home's Hero/"Featured"
 * section. `hasAIInsights` is what lets the Hero honestly badge itself
 * "AI Recommended" instead of just "Trending" when true, folding the
 * "Featured" and "AI Recommended" homepage requirements into the one
 * existing hero slot rather than adding a new section.
 *
 * Product polishing phase, area 1 ("never intentionally display the
 * generic SVG for the Hero"): the ingestion-time and admin-backfill
 * image pipelines only ever touch NEWLY-fetched or explicitly-backfilled
 * rows, so it's possible for the CURRENT top-trending article to still
 * be sitting on its local category placeholder. Since the Hero is the
 * one slot on the whole site where that's most visible, this is the one
 * place read-time falls through to a live `searchStockImage` call (by
 * title/keywords, same stage-3 provider chain ingestion itself uses)
 * before ever accepting the local SVG - bounded by
 * `HERO_IMAGE_SEARCH_TIMEOUT_MS` so a slow provider can't stall the
 * homepage, and persisted back via `updateImages` (fire-and-forget) so
 * this lookup only ever happens once per article, not once per request.
 *
 * Wrapped in React's `cache()` (product polishing phase, area 5) so
 * `HeroSection`, `LatestNews`, and `MostRead` - three independent
 * Server Components that each need to know which article is currently
 * featured, in order to exclude it from their own lists - share a
 * single request-scoped call instead of tripling this query per
 * homepage render.
 */
export const getFeaturedArticle = cache(async (): Promise<FeaturedArticle | null> => {
  try {
    const { articles, ai } = await getRepositories();
    const [top] = await articles.listTopByTrending(1);
    if (!top) return null;
    const insight = await ai.getLatest(top.id);

    let image = resolveDisplayImage(top);
    const stillOnPlaceholder = !top.image_source || top.image_source === "placeholder";
    if (stillOnPlaceholder) {
      const category = VALID_CATEGORIES.has(top.category as NewsCategory) ? (top.category as NewsCategory) : "Technology";
      const stockResult = await withTimeout(searchStockImage(top.title, category), HERO_IMAGE_SEARCH_TIMEOUT_MS);
      if (stockResult) {
        image = stockResult.url;
        articles.updateImages([{ id: top.id, imageUrl: stockResult.url, imageSource: `stock:${stockResult.provider}` }]).catch((error) => {
          console.error("[article-read-service] getFeaturedArticle: failed to persist hero stock image:", error);
        });
      }
    }

    return { ...toCategoryNewsItem(top), image, hasAIInsights: insight !== null };
  } catch (error) {
    console.error("[article-read-service] getFeaturedArticle failed:", error);
    return null;
  }
});

/**
 * Top-N trending articles for the homepage's "Featured Story" carousel
 * (homepage redesign - the reference layout's dot-navigated hero, one
 * real story per dot instead of a single static Hero). Same
 * `hasAIInsights` flag as `getFeaturedArticle` (that function's single-
 * article shape is unchanged and still used wherever only one featured
 * article is needed - `LatestNews`/`MostRead` excluding it from their
 * own lists). Deliberately its own query rather than "call
 * `getFeaturedArticle` N times" - one `listTopByTrending(limit)` round
 * trip covers every slide.
 */
export const getFeaturedArticles = cache(async (limit = 4): Promise<FeaturedArticle[]> => {
  try {
    const { articles, ai } = await getRepositories();
    const top = await articles.listTopByTrending(limit);
    if (top.length === 0) return [];

    const insights = await Promise.all(top.map((row) => ai.getLatest(row.id)));
    return top.map((row, index) => ({ ...toCategoryNewsItem(row), hasAIInsights: insights[index] !== null }));
  } catch (error) {
    console.error("[article-read-service] getFeaturedArticles failed:", error);
    return [];
  }
});

const RELEASE_VERSION_PATTERN = /\bv?(\d+(?:\.\d+){1,3}(?:-[a-z0-9.]+)?)\b/i;

export type ReleaseStatus = "Stable" | "Beta" | "RC" | "LTS";

export type LatestReleaseItem = {
  name: string;
  subtitle: string;
  glyph: string;
  tileBg: string;
  tileColor: string;
  version: string;
  slug: string;
  /** Real-article-derived release channel (see `classifyReleaseStatus`) - defaults to "Stable" only when neither the title nor description mentions a pre-release/LTS keyword, never a guess pulled from anywhere else. */
  status: ReleaseStatus;
  /** Human-relative form of the chosen article's real `published_at` (e.g. "Yesterday", "3 days ago") - see `formatRelativeDate`. */
  relativeDate: string;
  /**
   * Copied straight from the matching `WatchedRelease.techSlug` (Developer
   * Release Detail redesign) - lets the homepage widget link to
   * `/developer-hub/releases/[techSlug]` (a dedicated documentation/
   * overview page for the technology) instead of the widget's previous
   * behavior of linking to whichever real news article happened to back
   * this row, which was a category mismatch (a release row isn't the
   * same thing as the article that mentioned it).
   */
  techSlug: string;
};

/** Tries to pull a real version-like token out of a title/description pair - `null` when neither has one. */
function extractVersion(title: string, description: string): string | null {
  const match = RELEASE_VERSION_PATTERN.exec(title) ?? RELEASE_VERSION_PATTERN.exec(description);
  if (!match) return null;
  return match[0].toLowerCase().startsWith("v") ? match[0] : `v${match[1]}`;
}

/**
 * Real-article-derived release channel for the "Developer Releases"
 * widget's colored status badge (Phase F). Keyword-matched against the
 * SAME title/description pair `extractVersion` already reads for that
 * row - never an invented classification. LTS/RC/Beta/Alpha keywords
 * are checked in that priority order (an "LTS" release is never also
 * flagged Beta even if "beta" appears elsewhere in a longer description);
 * anything that matches none of them is the honest default, "Stable".
 */
function classifyReleaseStatus(title: string, description: string): ReleaseStatus {
  const text = `${title} ${description}`.toLowerCase();
  if (/\blts\b|long[- ]term support/.test(text)) return "LTS";
  if (/\brc\d*\b|release candidate/.test(text)) return "RC";
  if (/\bbeta\b|\balpha\b|\bpreview\b|\bcanary\b/.test(text)) return "Beta";
  return "Stable";
}

const RELATIVE_DATE_DAY_MS = 24 * 60 * 60 * 1000;

/** Human-relative form of an ISO timestamp ("Today"/"Yesterday"/"N days ago"/"N weeks ago"/"N months ago") - the "Yesterday"-style date Phase F's Developer Releases/Resources widgets want, distinct from `formatPublishedDate`'s absolute "May 21, 2026" form used elsewhere. */
function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / RELATIVE_DATE_DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/**
 * Real, DB-derived rows for the homepage's "Latest Releases" widget
 * (homepage redesign). For each tool in `WATCHED_RELEASES`
 * (`data/homepage-widgets.ts` - search input + generic display labels
 * only, see that file's doc comment):
 *
 *  1. Exact-title search (`ArticleRepository.search({ title })`) for the
 *     tool's name/aliases, newest first - the fast, most literal path.
 *  2. If nothing there has an extractable version token
 *     (`RELEASE_VERSION_PATTERN` - e.g. "TypeScript 5.9 Beta Released
 *     with New Decorator Support" -> "v5.9"), falls back to real
 *     full-text search (`fullTextSearch` - title/description/content/
 *     tags/AI summary, not just the title) for the same terms, since most
 *     real-world coverage of a release doesn't put the version number in
 *     the headline itself.
 *  3. If a version token is found anywhere in that wider pool (title OR
 *     description), it's used. If real articles about the tool exist but
 *     genuinely none of them state a version number, the row still
 *     renders - linked to the most recent real match - with an honest
 *     "Latest" badge instead of a fabricated version number.
 *
 * A tool is only ever omitted entirely when NO real article mentions it
 * at all right now - this widget never invents a release, a version
 * number, or a headline that isn't backed by an actual stored article.
 */
export async function getLatestReleases(limit = 6): Promise<LatestReleaseItem[]> {
  try {
    const { articles } = await getRepositories();

    const perTool = await Promise.all(
      WATCHED_RELEASES.map(async (tool: WatchedRelease) => {
        const terms = [tool.name, ...(tool.aliases ?? [])];

        const titleResults = await Promise.all(
          terms.map((term) => articles.search({ title: term, sortBy: "published_at", sortAscending: false, page: 1, pageSize: 5 }))
        );
        const titlePool = titleResults.flatMap((result) => result.items);

        const versionedFromTitle = titlePool.find((row) => extractVersion(row.title, row.description) !== null);
        if (versionedFromTitle) {
          return {
            name: tool.name,
            subtitle: tool.subtitle,
            glyph: tool.glyph,
            tileBg: tool.tileBg,
            tileColor: tool.tileColor,
            version: extractVersion(versionedFromTitle.title, versionedFromTitle.description) as string,
            slug: versionedFromTitle.slug,
            status: classifyReleaseStatus(versionedFromTitle.title, versionedFromTitle.description),
            relativeDate: formatRelativeDate(versionedFromTitle.published_at),
            techSlug: tool.techSlug,
          } satisfies LatestReleaseItem;
        }

        // Nothing in the exact-title pool had a version - widen to real
        // full-text search (title/description/content/tags/AI summary)
        // before giving up on a version number entirely.
        const ftsResults = await Promise.all(
          terms.map((term) =>
            articles.fullTextSearch({ query: term, sortBy: "newest", page: 1, pageSize: 5 }).catch(() => null)
          )
        );
        const ftsPool = ftsResults.filter((result) => result !== null).flatMap((result) => result.items);
        const combinedPool = [...titlePool, ...ftsPool];
        if (combinedPool.length === 0) return null;

        const versionedFromFts = ftsPool.find((row) => extractVersion(row.title, row.description) !== null);
        const chosen = versionedFromFts ?? combinedPool[0];
        const version = versionedFromFts ? extractVersion(chosen.title, chosen.description) : null;

        return {
          name: tool.name,
          subtitle: tool.subtitle,
          glyph: tool.glyph,
          tileBg: tool.tileBg,
          tileColor: tool.tileColor,
          version: version ?? "Latest",
          slug: chosen.slug,
          status: classifyReleaseStatus(chosen.title, chosen.description),
          relativeDate: formatRelativeDate(chosen.published_at),
          techSlug: tool.techSlug,
        } satisfies LatestReleaseItem;
      })
    );

    return perTool.filter((item): item is LatestReleaseItem => item !== null).slice(0, limit);
  } catch (error) {
    console.error("[article-read-service] getLatestReleases failed:", error);
    return [];
  }
}

/**
 * Real, DB-backed "Related News" for the Developer Release Detail page's
 * right sidebar (`src/data/releases.ts`'s `relatedNewsSearchTerms`) - the
 * same "search curated terms, dedupe by article id, newest first" shape
 * `getResourcesNews` already uses, but backed by `fullTextSearch` (title/
 * description/content/tags/AI summary) rather than the plainer
 * `search({ searchText })`, since most real coverage of a technology
 * doesn't put its name in the headline alone (same reasoning documented
 * on `getLatestReleases`'s fallback path). Returns real articles only -
 * an empty array, never a fabricated placeholder, when nothing currently
 * in the database mentions the technology.
 */
export async function getRelatedNewsForTechnology(searchTerms: string[], limit = 4): Promise<CategoryNewsItem[]> {
  try {
    if (searchTerms.length === 0) return [];
    const { articles } = await getRepositories();

    const perTerm = await Promise.all(
      searchTerms.map((term) =>
        articles.fullTextSearch({ query: term, sortBy: "newest", page: 1, pageSize: limit + 2 }).catch(() => null)
      )
    );

    const byId = new Map<string, ArticleRow>();
    for (const result of perTerm) {
      if (!result) continue;
      for (const row of result.items) {
        if (!byId.has(row.id)) byId.set(row.id, row);
      }
    }

    return Array.from(byId.values())
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, limit)
      .map(toCategoryNewsItem);
  } catch (error) {
    console.error("[article-read-service] getRelatedNewsForTechnology failed:", error);
    return [];
  }
}

export type ResourceBadge = "FREE" | "UPDATED" | "NEW";

export type ResourceNewsItem = {
  slug: string;
  title: string;
  source: string;
  sourceLogo: string;
  publishedDate: string;
  /** Real-article-derived badge (see `classifyResourceBadge`) - `null` when the title has no free/update keyword AND the article isn't recent enough to honestly call "new". */
  badge: ResourceBadge | null;
};

/**
 * Real-article-derived badge for the "Developer Resources" widget
 * (Phase F) - checked in this priority order against the article's own
 * title, then (only if neither keyword matched) its real publish
 * recency, so a genuinely free/updated resource is never demoted to a
 * generic "NEW" just because it's also recent:
 *
 *  1. "FREE" - title mentions "free" or "scholarship" (both watched
 *     terms already imply no-cost access - see `RESOURCE_SEARCH_TERMS`).
 *  2. "UPDATED" - title explicitly says "updated"/"new version"/
 *     "refreshed".
 *  3. "NEW" - neither keyword matched, but the article published within
 *     the last 7 days (a real, `published_at`-derived cutoff).
 *  4. `null` - none of the above; the row still renders, just with no
 *     badge, rather than forcing an inaccurate one.
 */
function classifyResourceBadge(title: string, publishedAt: string): ResourceBadge | null {
  const text = title.toLowerCase();
  if (/\bfree\b|\bscholarship\b/.test(text)) return "FREE";
  if (/\bupdated?\b|new version|\brefresh(ed)?\b/.test(text)) return "UPDATED";
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  if (ageMs <= 7 * RELATIVE_DATE_DAY_MS) return "NEW";
  return null;
}

/**
 * Real, DB-derived rows for the homepage's "Resources & Career Hub"
 * widget (homepage redesign) - developer career news (free
 * certifications, learning paths, licenses) rather than a courses
 * catalog. Searches recent articles for each term in
 * `RESOURCE_SEARCH_TERMS` (`data/homepage-widgets.ts`) via
 * `ArticleRepository.search()`'s plain `searchText` match (title/url/tags
 * - same ILIKE match the admin Articles list already uses), merges and
 * de-duplicates the results by article id, and returns the most recent
 * ones. Every row is a real, currently-stored article's own title/date/
 * source - nothing here is a curated headline.
 */
export async function getResourcesNews(limit = 5): Promise<ResourceNewsItem[]> {
  try {
    const { articles } = await getRepositories();

    const perTerm = await Promise.all(
      RESOURCE_SEARCH_TERMS.map((term) =>
        articles.search({ searchText: term, sortBy: "published_at", sortAscending: false, page: 1, pageSize: 3 })
      )
    );

    const byId = new Map<string, ArticleRow>();
    for (const result of perTerm) {
      for (const row of result.items) {
        if (!byId.has(row.id)) byId.set(row.id, row);
      }
    }

    return Array.from(byId.values())
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, limit)
      .map((row) => ({
        slug: row.slug,
        title: row.title,
        source: resolveSourceName(row.source_id),
        sourceLogo: resolveSourceLogo(row.source_id),
        publishedDate: formatPublishedDate(row.published_at),
        badge: classifyResourceBadge(row.title, row.published_at),
      }));
  } catch (error) {
    console.error("[article-read-service] getResourcesNews failed:", error);
    return [];
  }
}

/** `CategoryNewsItem` plus a real `article_metrics.view_count` (see `getMostRead`'s doc comment) - `null` only if the metrics row itself is somehow missing (shouldn't happen post-`ensureExists`, defensive). */
export type MostReadItem = CategoryNewsItem & { viewCount: number | null };

/**
 * Top-N "most read" items for the homepage's Most Read widget.
 *
 * BUG FIX (Most Read ordering audit): this used to rank by
 * `trending_score` (`articles.search({ sortBy: "trending_score" })`),
 * fetching real `view_count` only for display. `trending_score` is NOT a
 * popularity metric - see `lib/news/trending-score.ts`: it's ~70%
 * recency-decay + 30% source trust, with real view/bookmark counts
 * explicitly documented there as "still unused by any current caller".
 * It's also only recomputed while an article stays in a live provider
 * poll, then frozen forever - so ranking by it looked recency-biased/
 * effectively random relative to actual reader popularity, which is
 * exactly the reported bug ("ordering appears random or based on
 * publication date").
 *
 * Fixed to rank strictly by the real `article_metrics.view_count` column
 * - the same number already shown in the widget ("N views") - via
 * `ArticleMetricsRepository.listTopByViewCount()`'s real, exact
 * `ORDER BY view_count DESC LIMIT` SQL query, never falling back to
 * `published_at`. `view_count` lives on a separate table from `articles`
 * (see `article_metrics`'s schema), so this is a real two-step join done
 * in application code (one `ORDER BY` query for the ranking, one bulk
 * `getByIds` for the matching article rows), not a client-side re-sort
 * of an already-different-ordered page - the result order is set once,
 * by `listTopByViewCount`, and preserved end to end: `getByIds` doesn't
 * guarantee it returns rows in the same order as the input id list (a
 * plain SQL `.in()` doesn't promise that), so this maps back over
 * `topMetrics` (already in the correct, real order) rather than over
 * whatever order `getByIds` happens to return.
 *
 * This is also the exact same metric/direction (`view_count DESC`) the
 * dedicated `/most-read` page's pooled "most-read" sort now ranks by
 * (see `getNewsExplorerArticles`'s `most-read` branch) - the homepage
 * widget and "View all" page are both real, exact, view-count-ranked,
 * never recency-ranked.
 */
export async function getMostRead(limit = 5): Promise<MostReadItem[]> {
  try {
    const { articles, metrics } = await getRepositories();
    const topMetrics = await metrics.listTopByViewCount(limit);
    const articleRows = await articles.getByIds(topMetrics.map((row) => row.article_id));
    const articleById = new Map(articleRows.map((row) => [row.id, row]));

    const items: MostReadItem[] = [];
    for (const metricRow of topMetrics) {
      const articleRow = articleById.get(metricRow.article_id);
      if (!articleRow) continue; // Metrics row for a since-deleted/unknown article - skip rather than render a broken card.
      items.push({ ...toCategoryNewsItem(articleRow), viewCount: metricRow.view_count });
    }
    return items;
  } catch (error) {
    console.error("[article-read-service] getMostRead failed:", error);
    return [];
  }
}

export type TrendingCategoryStat = {
  rank: number;
  name: string;
  articleCount: string;
  /** Emoji icon for this category, from `src/data/categories.ts`'s taxonomy - falls back to a generic newspaper icon for any category that somehow isn't in that list. */
  icon: string;
  /** Total stored articles in this category (the number `articleCount` is formatted from). */
  count: number;
  /** This-week-vs-last-week direction, computed from `sparkline`'s underlying 14-day window - see `buildCategoryTrendStats`. `"new"` means last week had zero articles but this week has at least one (a fresh/reactivated category, not yet meaningfully comparable as a percentage). */
  trendDirection: "up" | "down" | "flat" | "new";
  /** Absolute percent change, this week vs last week - 0 for "flat"/"new". */
  trendPercent: number;
  /** Daily article counts for the last 7 days, oldest to newest - the data behind the widget's mini sparkline. */
  sparkline: number[];
  /** The single newest article in this category, for the widget's inline preview - `null` only if the category somehow has a count but no rows returned (shouldn't happen, defensive). */
  latestArticle: { slug: string; title: string; image: string } | null;
};

/**
 * Buckets a pool of already-fetched rows into one category's last-14-days
 * daily counts, then derives the 7-day sparkline and a this-week-vs-
 * last-week trend direction/percent from it. Pure in-memory computation -
 * no extra query per category - the caller (`getTrendingCategories`)
 * fetches the whole 14-day window ONCE across every category and calls
 * this once per category against that same shared pool, the same
 * "caller buckets rows in application code" convention
 * `listPublishedBetween`'s own doc comment establishes for Admin
 * Analytics' Time Series chart.
 */
function buildCategoryTrendStats(
  fourteenDayPool: ArticleRow[],
  categoryName: string
): Pick<TrendingCategoryStat, "sparkline" | "trendDirection" | "trendPercent"> {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const dailyCounts = new Array(14).fill(0) as number[]; // index 0 = 13 days ago ... index 13 = today

  for (const row of fourteenDayPool) {
    if (row.category !== categoryName) continue;
    const ageMs = now - new Date(row.published_at).getTime();
    const dayIndex = 13 - Math.floor(ageMs / DAY_MS);
    if (dayIndex >= 0 && dayIndex < 14) dailyCounts[dayIndex] += 1;
  }

  const sparkline = dailyCounts.slice(7, 14);
  const thisWeek = sparkline.reduce((sum, value) => sum + value, 0);
  const lastWeek = dailyCounts.slice(0, 7).reduce((sum, value) => sum + value, 0);

  if (lastWeek === 0) {
    return { sparkline, trendDirection: thisWeek > 0 ? "new" : "flat", trendPercent: 0 };
  }

  const diff = thisWeek - lastWeek;
  return {
    sparkline,
    trendDirection: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
    trendPercent: Math.abs(Math.round((diff / lastWeek) * 100)),
  };
}

/**
 * Real per-category stats across all 12 canonical categories
 * (`SEARCH_CATEGORY_SLUGS`), sorted by article count descending - backs
 * the redesigned "Trending Topics" widget (Home) with the site's actual
 * category distribution, trend direction, a 7-day sparkline, and each
 * category's newest article, instead of a static topic list or a bare
 * rank+count row.
 *
 * Previously this tallied category frequency across only the top-100
 * highest-`trending_score` articles (`listTopByTrending(100)`). That
 * was a fragile proxy: a brand-new article starts with a low
 * `trending_score` regardless of category, so any category whose
 * articles hadn't yet accumulated enough score to crack that
 * fixed-size-100 pool was invisible to this widget - even once real
 * articles existed for it. Fixed by running one small, count-only query
 * per category in parallel (same pattern `getCategoryFilterCounts`
 * already uses for the search sidebar's filter counts) instead of
 * sampling a trending-score-ordered pool - every category with at least
 * one stored article is counted correctly. That query already returns
 * each category's newest article too (`search()` defaults to
 * newest-first), so no separate "latest article" round trip is needed.
 *
 * The sparkline/trend numbers come from one ADDITIONAL query - a single
 * 14-day window across every category at once (`listPublishedBetween`,
 * capped at 3000 rows) - rather than a second per-category query each,
 * bucketed in application code by `buildCategoryTrendStats`.
 */
export async function getTrendingCategories(limit = 6): Promise<TrendingCategoryStat[]> {
  try {
    const { articles } = await getRepositories();

    const perCategory = await Promise.all(
      SEARCH_CATEGORY_SLUGS.map(async ({ name }) => {
        const result = await articles.search({ category: name, page: 1, pageSize: 1 });
        return { name, count: result.total, latest: result.items[0] ?? null };
      })
    );

    const active = perCategory
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    if (active.length === 0) return [];

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDayPool = await articles.listPublishedBetween(fourteenDaysAgo, new Date().toISOString(), 3000);

    return active.map((entry, index) => ({
      rank: index + 1,
      name: entry.name,
      articleCount: `${entry.count} article${entry.count === 1 ? "" : "s"}`,
      icon: CATEGORY_ICON_BY_NAME.get(entry.name) ?? "📰",
      count: entry.count,
      ...buildCategoryTrendStats(fourteenDayPool, entry.name),
      latestArticle: entry.latest
        ? { slug: entry.latest.slug, title: entry.latest.title, image: resolveDisplayImage(entry.latest) }
        : null,
    }));
  } catch (error) {
    console.error("[article-read-service] getTrendingCategories failed:", error);
    return [];
  }
}

export type TopSourceStat = {
  name: string;
  count: number;
};

/**
 * Which sources publish the most in this category, ranked by article
 * count - backs the category sidebar's "Top Sources" widget (product
 * polishing phase, area 7: the "Popular Tags" widget it replaces was a
 * static list of non-clickable pills built straight from the taxonomy
 * data, with no real discovery value). Counts across a bounded recent
 * pool of the category's own articles (not a second full-table scan) so
 * it reflects which sources are actively covering this category, and
 * doubles as real navigation - the UI links each source through to a
 * source-filtered search.
 */
export async function getTopSourcesForCategory(categoryName: string, limit = 5): Promise<TopSourceStat[]> {
  try {
    const { articles } = await getRepositories();
    const result = await articles.search({ category: categoryName, page: 1, pageSize: 300 });

    const counts = new Map<string, number>();
    for (const row of result.items) {
      const name = resolveSourceName(row.source_id);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error("[article-read-service] getTopSourcesForCategory failed:", error);
    return [];
  }
}

export type BreakingNewsArticle = CategoryNewsItem & { isFresh: boolean };

/**
 * High-trending articles published within the last 48 hours - backs the
 * "Breaking News" section. Falls back to the top-trending pool
 * regardless of age when fewer than `limit` articles are actually fresh
 * (a young or slow-moving dataset shouldn't render an empty "Breaking
 * News" section) - `isFresh` tells the UI which is which, so a
 * genuinely-recent story can still get a distinct "just in" treatment
 * even when the section as a whole had to backfill with older items.
 */
export async function getBreakingNews(limit = 4, excludeSlugs: string[] = []): Promise<BreakingNewsArticle[]> {
  try {
    const { articles } = await getRepositories();
    const pool = await articles.listTopByTrending(Math.max(limit * 5, 30) + excludeSlugs.length);
    const filtered = pool.filter((row) => !excludeSlugs.includes(row.slug));

    const freshCutoff = Date.now() - 48 * 60 * 60 * 1000;
    const fresh = filtered.filter((row) => new Date(row.published_at).getTime() >= freshCutoff);
    const chosen = (fresh.length >= limit ? fresh : filtered).slice(0, limit);
    const freshIds = new Set(fresh.map((row) => row.id));

    return chosen.map((row) => ({ ...toCategoryNewsItem(row), isFresh: freshIds.has(row.id) }));
  } catch (error) {
    console.error("[article-read-service] getBreakingNews failed:", error);
    return [];
  }
}

/** Paginated articles for one category - backs the category page's grid + `Pagination` component. */
export async function searchCategoryArticles(categoryName: string, page: number, pageSize: number): Promise<ArticlesPage> {
  try {
    const { articles } = await getRepositories();
    const result = await articles.search({ category: categoryName, page, pageSize });
    return {
      items: result.items.map(toCategoryNewsItem),
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
      page: result.page,
      pageSize: result.pageSize,
    };
  } catch (error) {
    console.error("[article-read-service] searchCategoryArticles failed:", error);
    return emptyPage(page, pageSize);
  }
}

/** Most recent articles for one category - backs the category page's "Recently Added" sidebar list. */
export async function getRecentArticlesForCategory(categoryName: string, limit = 5): Promise<CategoryNewsItem[]> {
  try {
    const { articles } = await getRepositories();
    const result = await articles.search({ category: categoryName, page: 1, pageSize: limit });
    return result.items.map(toCategoryNewsItem);
  } catch (error) {
    console.error("[article-read-service] getRecentArticlesForCategory failed:", error);
    return [];
  }
}

export type SearchSortOrder = "relevance" | "newest" | "oldest";

export type SearchQueryParams = Partial<
  Pick<FullTextSearchParams, "sourceId" | "category" | "categories" | "language" | "country" | "tag" | "dateFrom" | "dateTo">
> & {
  /** Free-text query, searched across title/description/content/tags/author/category/AI summary/TLDR/source name - see `ArticleRepository.fullTextSearch()`. Was called `title` before this became real full-text search; renamed since it's no longer a title-only filter. */
  query?: string;
  /** Result order - defaults to 'relevance' when a text query is present, 'newest' otherwise (relevance ranking has no meaning without a query). */
  sort?: SearchSortOrder;
  page?: number;
  pageSize?: number;
};

/** A search result item, same shape every other listing already renders (`NewsCard`, etc.) plus which field the query actually matched - powers the "Matched in X" badge on the search results page. Optional: the filter-only browse path (no text query - see `searchArticlesReal`) has no match field to report, since nothing was text-matched. */
export type SearchResultItem = CategoryNewsItem & { matchedIn?: string };

export type SearchArticlesPage = {
  items: SearchResultItem[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

function emptySearchPage(page: number, pageSize: number): SearchArticlesPage {
  return { items: [], total: 0, totalPages: 1, page, pageSize };
}

function hasAnyFilter(params: SearchQueryParams): boolean {
  return Boolean(
    (params.categories && params.categories.length > 0) ||
      params.category ||
      params.dateFrom ||
      params.dateTo ||
      params.tag ||
      params.sourceId ||
      params.language ||
      params.country
  );
}

/**
 * Real search for the public `/search` page, with two paths:
 *
 *  - Text query present: relevance-ranked full-text search via
 *    `ArticleRepository.fullTextSearch()` (title/description/content/
 *    tags/author/category on `articles` itself, plus AI summary/TLDR
 *    and source name - see `supabase/migrations/0004_full_text_search.sql`
 *    and `0008_search_sort_and_title_boost.sql`). `sort` maps onto the
 *    SQL function's `sort_by` ('relevance'/'newest'/'oldest').
 *  - No text query, but at least one filter (time/category/etc.) is
 *    set: a plain filtered browse listing via `ArticleRepository.search()`
 *    (no relevance ranking to speak of - sorted by publish date,
 *    'oldest' reversing the direction). This is what makes "Time
 *    filters must actually filter results" / "Category filters must
 *    work correctly together" true even when the user hasn't typed a
 *    keyword - previously this function short-circuited to an empty
 *    page whenever `query` was blank, silently ignoring every filter.
 *  - Neither a query nor any filter: empty page (the search page's
 *    "Enter a keyword or choose a filter to get started" landing
 *    state), matching the original "type something to see results"
 *    behavior for a genuinely empty search.
 *
 * Source/category(ies)/language/country/tag/date filters are ANDed
 * with the text match (or with each other, in the filter-only path).
 * `categories` (plural) is what the search page's multi-select
 * Category checkboxes use - every checked category is honored, not
 * just the first (see `0007_search_multi_category.sql`).
 */
export async function searchArticlesReal(params: SearchQueryParams): Promise<SearchArticlesPage> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const hasQuery = Boolean(params.query && params.query.trim().length > 0);

  if (!hasQuery && !hasAnyFilter(params)) {
    return emptySearchPage(page, pageSize);
  }

  try {
    const { articles } = await getRepositories();

    if (hasQuery) {
      const result = await articles.fullTextSearch({
        query: params.query as string,
        sourceId: params.sourceId,
        category: params.category,
        categories: params.categories,
        language: params.language,
        country: params.country,
        tag: params.tag,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        sortBy: params.sort ?? "relevance",
        page,
        pageSize,
      });
      return {
        items: result.items.map((row) => ({ ...toCategoryNewsItem(row), matchedIn: row.matched_in })),
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
        page: result.page,
        pageSize: result.pageSize,
      };
    }

    const result = await articles.search({
      category: params.category,
      categories: params.categories,
      tag: params.tag,
      sourceId: params.sourceId,
      language: params.language,
      country: params.country,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sortBy: "published_at",
      sortAscending: params.sort === "oldest",
      page,
      pageSize,
    });
    return {
      items: result.items.map((row) => toCategoryNewsItem(row)),
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
      page: result.page,
      pageSize: result.pageSize,
    };
  } catch (error) {
    console.error("[article-read-service] searchArticlesReal failed:", error);
    return emptySearchPage(page, pageSize);
  }
}

/** Real match counts per category slug, for the search sidebar's category filter counts. Runs one small `count`-only query per category, in parallel. */
export async function getCategoryFilterCounts(options: { slug: string; name: string }[]): Promise<Record<string, number>> {
  try {
    const { articles } = await getRepositories();
    const entries = await Promise.all(
      options.map(async ({ slug, name }) => {
        const result = await articles.search({ category: name, page: 1, pageSize: 1 });
        return [slug, result.total] as const;
      })
    );
    return Object.fromEntries(entries);
  } catch (error) {
    console.error("[article-read-service] getCategoryFilterCounts failed:", error);
    return {};
  }
}

/** Real match counts per time-range filter (e.g. "last 7 days"), for the search sidebar's time filter counts. Runs one small `count`-only query per range, in parallel. */
export async function getTimeFilterCounts(options: { id: string; maxDays: number }[]): Promise<Record<string, number>> {
  try {
    const { articles } = await getRepositories();
    const now = Date.now();
    const entries = await Promise.all(
      options.map(async ({ id, maxDays }) => {
        const dateFrom = new Date(now - maxDays * 24 * 60 * 60 * 1000).toISOString();
        const result = await articles.search({ dateFrom, page: 1, pageSize: 1 });
        return [id, result.total] as const;
      })
    );
    return Object.fromEntries(entries);
  } catch (error) {
    console.error("[article-read-service] getTimeFilterCounts failed:", error);
    return {};
  }
}

/**
 * Splits stored plain-text `articles.content` into paragraph blocks the
 * existing `ArticleContent` component already knows how to render. When
 * `content` is missing or too thin to read (below the same
 * `MIN_ACCEPTABLE_CONTENT_LENGTH` bar the ingestion-time
 * `fetchArticleContent` extractor already enforces for newly-fetched
 * articles - see `news-aggregator.ts`'s content-resolution stage), falls
 * back to a richer combination of `description` + the article's already
 * -existing AI enrichment (`summary`/`tldr`, from `article_ai` - never a
 * NEW AI call made here) instead of showing the bare, often single-
 * sentence `description` alone. This only matters for articles ingested
 * before that extraction stage existed, or where extraction itself
 * failed for that specific article's page (paywall, non-HTML response,
 * etc.) - product polishing phase, 2nd pass, area 8: "çok kısa
 * içerikler gösterme."
 */
function buildContentBlocks(
  content: string | null,
  description: string,
  aiSummary: string | null,
  tldr: StoredTldr | null
): ArticleContentBlock[] {
  const trimmedContent = content?.trim() ?? "";
  if (trimmedContent.length >= MIN_ACCEPTABLE_CONTENT_LENGTH) {
    // `splitIntoParagraphs` (not a plain `\n{2,}` split) so rows stored
    // before the extraction-time paragraph normalization fix - or any
    // future content source that doesn't preserve blank-line breaks -
    // still render as real paragraphs instead of one unbroken block.
    return splitIntoParagraphs(trimmedContent).map((text) => ({ type: "paragraph" as const, text }));
  }

  const blocks: ArticleContentBlock[] = [];
  const trimmedDescription = description?.trim() ?? "";
  if (trimmedDescription.length > 0) {
    blocks.push({ type: "paragraph", text: trimmedDescription });
  }

  const trimmedSummary = aiSummary?.trim() ?? "";
  if (trimmedSummary.length > 0 && trimmedSummary !== trimmedDescription) {
    blocks.push({ type: "paragraph", text: trimmedSummary });
  }

  const bulletText = (tldr?.bullets ?? []).map((bullet) => bullet.trim()).filter((bullet) => bullet.length > 0).join(" ");
  if (bulletText.length > 0) {
    blocks.push({ type: "paragraph", text: bulletText });
  }

  // Whatever short raw `content` did exist (below the length bar above,
  // but not necessarily empty) is still real article text, worth
  // showing after the richer summary blocks rather than discarding it.
  if (trimmedContent.length > 0 && trimmedContent !== trimmedDescription) {
    blocks.push({ type: "paragraph", text: trimmedContent });
  }

  return blocks;
}

/** Flattens `ArticleContentBlock[]` back to plain text - used only to feed `estimateReadingTime` on whatever content actually ends up on the page (see `getArticleDetail` below), so "Reading Time" reflects the real, final rendered length rather than a value computed once at ingestion time and never revisited. */
function blocksToPlainText(blocks: ArticleContentBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "list":
          return block.items.join(" ");
        case "image":
          return block.caption ?? "";
        case "table":
          return [block.headers.join(" "), ...block.rows.map((row) => row.join(" "))].join(" ");
        case "code":
          return ""; // Code doesn't count toward a prose reading-time estimate.
        default:
          return block.text;
      }
    })
    .join(" ")
    .trim();
}

export type ArticleAIInsights = {
  summary: string | null;
  /** Standalone Key Takeaways bullets (product polishing phase, 5th pass) - broad-tier, generated for every article a run touches, independent of whether that article also got a full `rewrittenArticle`. `null` only when no AI provider is configured, or this specific article fell outside even the broad tier's per-run cap. */
  keyTakeaways: StoredKeyTakeaways | null;
  tldr: StoredTldr | null;
  tags: string[];
  sentiment: StoredSentiment | null;
  bias: StoredBias | null;
  /** Companies/technologies/people actually named in the article (product polishing phase, 4th pass, item 8) - `null` when entity extraction hasn't run for this article yet (no AI provider configured, or it fell outside a pipeline run's per-run cap). */
  entities: StoredEntities | null;
};

/**
 * The article detail page's Priority-2 content ("Frontend priority:
 * 1. rewritten_article, 2. long_summary, 3. original content" -
 * automated-rewrite phase). Set whenever an AI-generated `long_summary`
 * exists for this article - `longSummaryStep` runs on the broad tier
 * (`ai-steps.ts`), so this is generated for every article a pipeline
 * run touches, not gated on the raw content being thin. `null` means no
 * `long_summary` has been generated yet (no AI provider configured, or
 * this article fell outside a run's broad-tier cap), in which case the
 * page falls through to `content` (the real/description-based blocks).
 */
export type StructuredSummary = StoredLongSummary;

export type ArticleDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  category: string;
  source: string;
  /** Raw `source_id` (e.g. `"reuters"`) - for the Article Detail redesign's breadcrumb (links to `/news?sources=<id>`) and Original Source card, which need the id itself, not just the display name. */
  sourceId: string;
  /** Real source logo path (or the shared default badge) - see `resolveSourceLogo` - for the redesigned page's single metadata row and Original Source card. */
  sourceLogo: string;
  /** The source's real homepage, from the source registry (`lib/news/sources.ts`) - `undefined` for a source with no registered website. Powers the Original Source card's domain line and CTA fallback. */
  sourceWebsite: string | undefined;
  sourceUrl: string;
  publishedDate: string;
  publishedAtIso: string;
  readingTime: string;
  /** Real `article_metrics.view_count` for this article - `null` only if no metrics row exists yet (shouldn't happen post-`ensureExists`, defensive). Never fabricated - the redesigned metadata row simply omits the view count when this is `null`. */
  viewCount: number | null;
  content: ArticleContentBlock[];
  /** Set whenever an AI long summary is available for this article, regardless of whether raw `content` is thin - see `StructuredSummary`'s doc comment for the full priority ordering. */
  structuredSummary: StructuredSummary | null;
  /**
   * The full 700-1500 word AI rewrite (product polishing phase, 4th
   * pass, items 6-7) - the article detail page's PRIMARY reading
   * content whenever it's available, ahead of both `content` and
   * `structuredSummary`. See `getArticleDetail`'s content-precedence
   * doc comment for the full fallback chain. `null` when no AI provider
   * is configured, or this article hasn't been rewritten yet (outside a
   * pipeline run's per-run cap) - callers fall back to `content`.
   */
  rewrittenArticle: StoredArticleRewrite | null;
  tags: string[];
  trustScore: number;
  trendingScore: number;
  ai: ArticleAIInsights | null;
  /** Admin Panel: Articles CMS "Published" toggle (0021_articles_admin_fields.sql). `false` means the page itself should 404 - see `/article/[slug]/page.tsx`. */
  visible: boolean;
};

/** Flattens a `StoredArticleRewrite` back to plain text - used only to feed `estimateReadingTime` when the rewrite is the resolved primary content (see `getArticleDetail`). */
function rewriteToPlainText(rewrite: StoredArticleRewrite): string {
  return [
    rewrite.intro,
    rewrite.mainContent,
    rewrite.background,
    rewrite.whyItMatters,
    rewrite.technicalDetails ?? "",
    ...rewrite.keyHighlights,
    rewrite.conclusion,
  ]
    .join(" ")
    .trim();
}

/** Flattens a `StructuredSummary` (AI long summary) back to plain text - the same `estimateReadingTime` feed as `rewriteToPlainText`, used when the long summary (not the rewrite) is the resolved primary content (see `getArticleDetail`'s priority-2 case). */
function structuredSummaryToPlainText(summary: StructuredSummary): string {
  return [summary.overview, ...summary.keyPoints, summary.technicalDetails ?? "", summary.whyItMatters ?? ""]
    .join(" ")
    .trim();
}

/**
 * Full article detail for `/article/[slug]` - the row itself plus its
 * latest AI enrichment (`article_ai`), never merged together at the
 * database level (see `article-ai-repository.ts`) but combined here
 * into the one shape the page needs. Returns `null` for a missing or
 * deleted article so the page can call `notFound()` instead of
 * crashing.
 *
 * Content precedence (automated-rewrite phase - "Frontend priority:
 * 1. rewritten_article, 2. long_summary, 3. original content"):
 *
 *  1. `rewrittenArticle` - the full AI rewrite, when available. This is
 *     the natural-reading, fully organized article a reader can finish
 *     inside Virexa, never just the raw RSS description.
 *     `ArticleContent.tsx` renders this ahead of everything else.
 *  2. `structuredSummary` (the AI-generated long summary) - used
 *     whenever a rewrite isn't available yet (no AI provider
 *     configured, or this article fell outside a pipeline run's broad-
 *     tier cap) but a long summary exists, REGARDLESS of whether the
 *     raw extracted `content` is thin or substantial - long_summary is
 *     generated for every article the broad tier touches, so it's a
 *     strictly better default reading experience than raw content
 *     whenever it exists, not just a thin-content rescue path.
 *  3. `content` (real extracted article text, via `buildContentBlocks`,
 *     or that function's own last-resort blend of description + AI
 *     summary/TLDR) - the final fallback for an article with neither a
 *     rewrite nor a long summary yet.
 *
 * `readingTime` is derived from whichever of these actually ends up as
 * the resolved primary content, so it always reflects what a reader
 * will actually see, not a value stamped once at ingestion time.
 */
export async function getArticleDetail(slug: string): Promise<ArticleDetail | null> {
  try {
    const { articles, ai, metrics } = await getRepositories();
    const row = await articles.getBySlug(slug);
    if (!row) return null;

    const aiRow = await ai.getLatest(row.id);
    const metricsRow = await metrics.getByArticleId(row.id);
    const content = buildContentBlocks(row.content, row.description, aiRow?.summary ?? null, aiRow?.tldr ?? null);

    const structuredSummary = aiRow?.long_summary ?? null;
    const rewrittenArticle = aiRow?.rewritten_article ?? null;

    // Reading time is recomputed here from the FINAL resolved content
    // (following the same rewrittenArticle -> structuredSummary ->
    // content priority as the page itself renders) rather than trusting
    // `row.reading_time`, which was only ever stamped once at ingestion
    // time from whatever thin content the provider originally supplied
    // and never revisited afterwards.
    const resolvedContentText = rewrittenArticle
      ? rewriteToPlainText(rewrittenArticle)
      : structuredSummary
        ? structuredSummaryToPlainText(structuredSummary)
        : blocksToPlainText(content);

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      image: resolveDisplayImage(row),
      category: row.category,
      source: resolveSourceName(row.source_id),
      sourceId: row.source_id,
      sourceLogo: resolveSourceLogo(row.source_id),
      sourceWebsite: getSourceById(row.source_id)?.website,
      // Prefer the article's own discussion page (currently only ever
      // set for Hacker News - see `types/database.ts`'s `discussion_url`
      // doc comment) over its plain `url`, so a link labeled with the
      // source's name always opens THAT source, not whatever external
      // site (e.g. a Reddit thread) the story happens to link to. Every
      // non-Hacker-News article has `discussion_url === null` and
      // this falls back to `url` exactly as before - zero behavior
      // change for RSS/NewsAPI/GNews-sourced articles.
      sourceUrl: row.discussion_url ?? row.url,
      publishedDate: formatPublishedDate(row.published_at),
      publishedAtIso: row.published_at,
      readingTime: `${estimateReadingTime(resolvedContentText, row.description)} min read`,
      viewCount: metricsRow?.view_count ?? null,
      content,
      structuredSummary,
      rewrittenArticle,
      tags: row.tags,
      trustScore: row.trust_score,
      trendingScore: row.trending_score,
      ai: aiRow
        ? {
            summary: aiRow.summary,
            keyTakeaways: aiRow.key_takeaways,
            tldr: aiRow.tldr,
            tags: aiRow.tags,
            sentiment: aiRow.sentiment,
            bias: aiRow.bias,
            entities: aiRow.entities,
          }
        : null,
      // Strict `!== false` rather than truthiness: `visible` only exists
      // because of migration 0021 (articles_admin_fields). If that
      // migration hasn't been run against this environment's database
      // yet, Postgrest simply omits the column from the row entirely -
      // `row.visible` comes back `undefined`, and a plain `!row.visible`
      // check would then treat every single article as hidden, 404-ing
      // the Article Detail page for everything while listings (which
      // never filter on `visible`) kept working fine. Only an explicit
      // `false` (an admin actually unpublishing the article) should hide
      // it; a missing/null column must fail open, matching this
      // codebase's "never break rendering over a soft-config gate"
      // convention used everywhere else (see `incrementArticleView`).
      visible: row.visible !== false,
    };
  } catch (error) {
    console.error("[article-read-service] getArticleDetail failed:", error);
    return null;
  }
}

/** Same-category articles (excluding the current one), most-trending first - the real "Similar Articles" list for the article detail page's sidebar. */
export async function getSimilarArticles(category: string, excludeId: string, limit = 4): Promise<CategoryNewsItem[]> {
  try {
    const { articles } = await getRepositories();
    const rows = await articles.getSimilar(category, excludeId, limit);
    return rows.map(toCategoryNewsItem);
  } catch (error) {
    console.error("[article-read-service] getSimilarArticles failed:", error);
    return [];
  }
}

export type SitemapArticleEntry = {
  slug: string;
  updatedAt: string;
};

export type ContentTypeFilter =
  | "news"
  | "release"
  | "tutorial"
  | "research"
  | "security-advisory"
  | "certification"
  | "open-source";

export type NewsExplorerSort = "newest" | "oldest" | "trending" | "most-read";

/**
 * Heuristic content-type classification for the News Explorer's Content
 * Type filter (Phase F) - `articles` has no such column, so this is
 * derived purely from the article's own real title/description/category/
 * tags, checked in this priority order (most specific first, so e.g. a
 * security-advisory-shaped title never gets miscategorized as a generic
 * "release" just because it also mentions a CVE-adjacent version
 * number). Every article gets exactly one value; "news" is the honest
 * default when nothing more specific matched - never an invented one.
 */
function classifyContentType(row: Pick<ArticleRow, "title" | "description" | "category" | "tags">): ContentTypeFilter {
  const text = `${row.title} ${row.description}`.toLowerCase();
  if (row.category === "Security" || /\bcve-\d|vulnerabilit(y|ies)|security advisory|\bexploit\b/.test(text)) {
    return "security-advisory";
  }
  if (/\bcertificat|\bcertified\b|\bcertification\b|\bexam\b/.test(text)) return "certification";
  if (row.tags.some((tag) => tag.toLowerCase().includes("open source")) || /\bopen[- ]source\b/.test(text)) {
    return "open-source";
  }
  if (/\btutorial\b|\bhow to\b|\bwalkthrough\b|\bstep[- ]by[- ]step\b|\bguide\b/.test(text)) return "tutorial";
  if (/\bresearch\b|\bpaper\b|\bstudy\b|\barxiv\b/.test(text)) return "research";
  if (RELEASE_VERSION_PATTERN.test(row.title) || /\brelease(d)?\b|\bversion\b|\bchangelog\b/.test(text)) return "release";
  return "news";
}

export type NewsExplorerItem = SearchResultItem & {
  contentType: ContentTypeFilter;
  /** Real `article_metrics.view_count` - `null` when no metrics row exists yet (see `MostReadItem.viewCount`). */
  viewCount: number | null;
};

export type NewsExplorerParams = {
  query?: string;
  categories?: string[];
  sourceIds?: string[];
  dateFrom?: string;
  contentType?: ContentTypeFilter;
  sort?: NewsExplorerSort;
  /** Restricts the candidate pool to real articles matching `RESOURCE_SEARCH_TERMS` (the same watch-list the homepage's "Developer Resources" widget is built from) - backs the unified `/resources` Explorer page. See `getNewsExplorerArticles`'s doc comment for how this pool is built. */
  resourcesOnly?: boolean;
  /** 1-based page number - real server-side pagination, not "Load More" (see `getNewsExplorerArticles`'s doc comment). Defaults to 1. */
  page?: number;
  pageSize?: number;
};

export type NewsExplorerArticlesPage = {
  items: NewsExplorerItem[];
  total: number;
  page: number;
  totalPages: number;
};

/** Direct-mode raw page size passed straight through to the repository - `search()` caps at 100, `fullTextSearch()` at 50, so the pooled path below uses two different constants for the two query paths. */
const NEWS_EXPLORER_POOL_PAGE_SIZE_SEARCH = 100;
const NEWS_EXPLORER_POOL_PAGE_SIZE_FTS = 50;
/** How many raw pages the pooled path fetches (in parallel) to build its candidate pool - 1000 rows for a plain browse, 500 for a text query. A hard, honest cap: see the pooled-path doc comment below for what happens beyond it. */
const NEWS_EXPLORER_POOL_PAGE_COUNT = 10;

/**
 * Most Read pool size (Most Read ordering audit) - the number of
 * highest-`view_count` `article_metrics` rows fetched to build the
 * "most-read" sort's candidate pool. Deliberately matches the general
 * pool budget above (`NEWS_EXPLORER_POOL_PAGE_COUNT *
 * NEWS_EXPLORER_POOL_PAGE_SIZE_SEARCH` = 1000) rather than introducing a
 * separate budget - same honest "bounded pool, real undercounting if a
 * filter combination has more matches than the pool holds" tradeoff
 * already documented on the function itself, just sourced from real
 * popularity instead of recency.
 */
const MOST_READ_POOL_SIZE = NEWS_EXPLORER_POOL_PAGE_COUNT * NEWS_EXPLORER_POOL_PAGE_SIZE_SEARCH;

/**
 * Real, filtered/sorted/paginated (true page numbers, not "Load More")
 * article listing for the `/news` "News Explorer" page. Two situations
 * can't be satisfied by a single, direct, exact database page fetch:
 *
 *  1. Content Type and multi-Source selection have no equivalent native
 *     database filter (`articles` has no content-type column, and
 *     `search()`/`fullTextSearch()` only accept ONE `sourceId`, not a
 *     set) - see `classifyContentType`'s doc comment.
 *  2. "Most Read" has no native `sortBy` option - `view_count` lives on
 *     a separate `article_metrics` row (same constraint documented on
 *     `getMostRead`), so ranking by it means joining metrics in first.
 *  3. `resourcesOnly` (the unified `/resources` page) has no single
 *     native filter either - it's real articles matching ANY of
 *     `RESOURCE_SEARCH_TERMS`, which requires one `searchText` query per
 *     term merged together (the exact same pattern `getResourcesNews`
 *     already uses for the homepage widget), not a single-column filter.
 *
 * For every OTHER combination (the common case: Time/Categories/a
 * single Source/Query, sorted by Newest/Oldest/Trending), this fetches
 * the requested page directly from the database in one round trip, with
 * an exact `total`/`totalPages` from the repository's own real count -
 * true random-access pagination, jump to page 1 or page 128 equally
 * cheaply.
 *
 * When Content Type, more-than-one Source, or "Most Read" IS active,
 * there's no way to jump straight to an arbitrary page without knowing
 * which rows match first, so this pulls a bounded, real candidate pool
 * (`NEWS_EXPLORER_POOL_PAGE_COUNT` raw pages, fetched in parallel - the
 * same "bounded pool, filtered/sorted in app code" convention
 * `getTopSourcesForCategory`/`getBreakingNews`/`getTrendingCategories`
 * already use elsewhere in this file), applies the filter/sort in
 * memory, and paginates that in-memory list directly. `total` in this
 * path is real but capped at pool size - if a filter combination
 * genuinely has more matches than the pool holds, this honestly
 * undercounts rather than fabricating a bigger number; a documented,
 * narrow-case tradeoff rather than a full schema migration for one page.
 */
export async function getNewsExplorerArticles(params: NewsExplorerParams = {}): Promise<NewsExplorerArticlesPage> {
  const pageSize = params.pageSize ?? 12;
  const requestedPage = Math.max(1, Math.floor(params.page ?? 1));
  const hasQuery = Boolean(params.query && params.query.trim().length > 0);
  const categories = params.categories && params.categories.length > 0 ? params.categories : undefined;
  const singleSourceId = params.sourceIds && params.sourceIds.length === 1 ? params.sourceIds[0] : undefined;
  const sourceIdSet = params.sourceIds && params.sourceIds.length > 1 ? new Set(params.sourceIds) : null;
  const needsPooledApproach =
    Boolean(params.contentType) || sourceIdSet !== null || params.sort === "most-read" || Boolean(params.resourcesOnly);

  // Debugging aid (per the "Most Read shows 0 results" investigation) -
  // logs the fully-resolved query this call is about to run BEFORE
  // anything can throw, so a silent failure further down (caught by the
  // try/catch below) still leaves a trail of what was actually
  // requested. Cheap enough to leave in permanently - one line per
  // Explorer page load, not per-row.
  console.log("[article-read-service] getNewsExplorerArticles: resolved query", {
    query: params.query ?? null,
    categories: categories ?? null,
    sourceIds: params.sourceIds ?? null,
    contentType: params.contentType ?? null,
    resourcesOnly: Boolean(params.resourcesOnly),
    sort: params.sort ?? "newest",
    dateFrom: params.dateFrom ?? null,
    page: requestedPage,
    pageSize,
    pooled: needsPooledApproach,
  });

  async function attachViewCounts(rows: ArticleRow[]): Promise<Map<string, number | null>> {
    const { metrics } = await getRepositories();
    const metricsRows = await metrics.getManyByArticleIds(rows.map((row) => row.id));
    return new Map(metricsRows.map((row) => [row.article_id, row.view_count]));
  }

  try {
    const { articles } = await getRepositories();

    if (!needsPooledApproach) {
      // Split (rather than a ternary sharing one `result`) so
      // `matched_in` (only present on `FullTextSearchRow`, the real
      // `search_articles_fts()` result - see `SearchResultItem`'s doc
      // comment) stays type-safe to read - it powers the Search Results
      // page's "Matched in X" badge (`ExplorerView`'s `explainMatches`).
      if (hasQuery) {
        const result = await articles.fullTextSearch({
          query: params.query as string,
          categories,
          sourceId: singleSourceId,
          dateFrom: params.dateFrom,
          sortBy: params.sort === "oldest" ? "oldest" : "newest",
          page: requestedPage,
          pageSize,
        });

        const viewCountById = await attachViewCounts(result.items);
        const items: NewsExplorerItem[] = result.items.map((row) => ({
          ...toCategoryNewsItem(row),
          contentType: classifyContentType(row),
          viewCount: viewCountById.get(row.id) ?? null,
          matchedIn: row.matched_in,
        }));

        console.log("[article-read-service] getNewsExplorerArticles: direct fullTextSearch result", {
          returnedCount: items.length,
          total: result.total,
          page: result.page,
        });

        return {
          items,
          total: result.total,
          page: result.page,
          totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
        };
      }

      const result = await articles.search({
        categories,
        sourceId: singleSourceId,
        dateFrom: params.dateFrom,
        sortBy: params.sort === "trending" ? "trending_score" : "published_at",
        sortAscending: params.sort === "oldest",
        page: requestedPage,
        pageSize,
      });

      const viewCountById = await attachViewCounts(result.items);
      const items: NewsExplorerItem[] = result.items.map((row) => ({
        ...toCategoryNewsItem(row),
        contentType: classifyContentType(row),
        viewCount: viewCountById.get(row.id) ?? null,
      }));

      console.log("[article-read-service] getNewsExplorerArticles: direct search result", {
        returnedCount: items.length,
        total: result.total,
        page: result.page,
      });

      return {
        items,
        total: result.total,
        page: result.page,
        totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
      };
    }

    // Pooled path - Content Type / multi-Source / Most-Read / resourcesOnly (see doc comment above).
    let pool: ArticleRow[];

    if (params.resourcesOnly) {
      // Real articles matching ANY watched resource term - one bounded
      // `searchText` query per term (same merge-by-id pattern
      // `getResourcesNews` uses), each already ANDed with categories/
      // source/date. A free-text `query` on top of that (someone typing
      // into the header search while already on `/resources`) is
      // honored as a plain in-memory substring check on top of this
      // pool, rather than a second full-text query - this pool is
      // already real/bounded, not a place to add a second network round
      // trip per term.
      const perTerm = await Promise.all(
        RESOURCE_SEARCH_TERMS.map((term) =>
          articles.search({
            searchText: term,
            categories,
            sourceId: singleSourceId,
            dateFrom: params.dateFrom,
            sortBy: params.sort === "trending" ? "trending_score" : "published_at",
            sortAscending: params.sort === "oldest",
            page: 1,
            pageSize: 150,
          })
        )
      );
      const byId = new Map<string, ArticleRow>();
      for (const result of perTerm) {
        for (const row of result.items) {
          if (!byId.has(row.id)) byId.set(row.id, row);
        }
      }
      pool = Array.from(byId.values());
      if (hasQuery) {
        const needle = (params.query as string).toLowerCase();
        pool = pool.filter(
          (row) => row.title.toLowerCase().includes(needle) || row.description.toLowerCase().includes(needle)
        );
      }
    } else if (params.sort === "most-read" && !hasQuery) {
      // BUG FIX (Most Read ordering audit): this branch used to reuse
      // the generic recency/trending pool below (`sortBy: "published_at"`
      // whenever `params.sort` wasn't `"trending"` - which "most-read"
      // isn't), fetch view counts for that recency-biased pool, and only
      // THEN sort by view count. That silently capped "most read" to
      // "most viewed among the ~1000 most-recently-published articles" -
      // a genuinely popular older article outside that recent window
      // could never appear on `/most-read` at all, which is exactly the
      // reported "ordering looks... publish-date-based" symptom.
      //
      // Fixed to build the candidate pool from real popularity FIRST:
      // the top `MOST_READ_POOL_SIZE` `article_metrics` rows by
      // `view_count` (a real, exact `ORDER BY view_count DESC LIMIT`
      // query - see `listTopByViewCount`), then fetch the matching
      // `articles` rows and apply every filter this page supports
      // in-memory (category/single-source/date can't be pushed into that
      // metrics query since `article_metrics` has none of those columns
      // - `sourceIdSet`/`contentType` are filtered the same way just
      // below regardless of which branch built the pool). No text query
      // support here (an exact metrics-driven pool and a full-text
      // ranked pool don't compose) - a query typed while sorted by "most
      // read" falls through to the generic pooled branch instead, same
      // as before.
      const { metrics } = await getRepositories();
      const topByViews = await metrics.listTopByViewCount(MOST_READ_POOL_SIZE);
      const topArticles = await articles.getByIds(topByViews.map((row) => row.article_id));
      const articleById = new Map(topArticles.map((row) => [row.id, row]));

      pool = topByViews
        .map((row) => articleById.get(row.article_id))
        .filter((row): row is ArticleRow => Boolean(row))
        .filter((row) => {
          if (categories && !categories.includes(row.category)) return false;
          if (singleSourceId && row.source_id !== singleSourceId) return false;
          if (params.dateFrom && row.published_at < params.dateFrom) return false;
          return true;
        });
    } else {
      const rawPageSize = hasQuery ? NEWS_EXPLORER_POOL_PAGE_SIZE_FTS : NEWS_EXPLORER_POOL_PAGE_SIZE_SEARCH;
      const rawPageNumbers = Array.from({ length: NEWS_EXPLORER_POOL_PAGE_COUNT }, (_, index) => index + 1);

      const batches = await Promise.all(
        rawPageNumbers.map((rawPage) =>
          hasQuery
            ? articles
                .fullTextSearch({
                  query: params.query as string,
                  categories,
                  sourceId: singleSourceId,
                  dateFrom: params.dateFrom,
                  sortBy: params.sort === "oldest" ? "oldest" : "newest",
                  page: rawPage,
                  pageSize: rawPageSize,
                })
                .then((result) => result.items as ArticleRow[])
            : articles
                .search({
                  categories,
                  sourceId: singleSourceId,
                  dateFrom: params.dateFrom,
                  sortBy: params.sort === "trending" ? "trending_score" : "published_at",
                  sortAscending: params.sort === "oldest",
                  page: rawPage,
                  pageSize: rawPageSize,
                })
                .then((result) => result.items)
        )
      );
      pool = batches.flat();
    }

    const filtered = pool.filter((row) => {
      if (sourceIdSet && !sourceIdSet.has(row.source_id)) return false;
      if (params.contentType && classifyContentType(row) !== params.contentType) return false;
      return true;
    });

    const viewCountById = await attachViewCounts(filtered);
    let ranked = filtered.map((row) => ({ row, viewCount: viewCountById.get(row.id) ?? null }));

    if (params.sort === "most-read") {
      ranked = [...ranked].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    }

    const total = ranked.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const clampedPage = Math.min(requestedPage, totalPages);
    const start = (clampedPage - 1) * pageSize;

    const items: NewsExplorerItem[] = ranked.slice(start, start + pageSize).map(({ row, viewCount }) => ({
      ...toCategoryNewsItem(row),
      contentType: classifyContentType(row),
      viewCount,
    }));

    console.log("[article-read-service] getNewsExplorerArticles: pooled result", {
      poolSize: pool.length,
      filteredSize: filtered.length,
      returnedCount: items.length,
      total,
      page: clampedPage,
    });

    return { items, total, page: clampedPage, totalPages };
  } catch (error) {
    console.error("[article-read-service] getNewsExplorerArticles failed:", error);
    return { items: [], total: 0, page: 1, totalPages: 1 };
  }
}

export type NewsExplorerStats = {
  articlesCount: number;
  releasesCount: number;
  resourcesCount: number;
  sourcesCount: number;
  lastUpdatedRelative: string;
};

/**
 * Real counts for the News Explorer's top-of-page stats strip (Phase F,
 * Turkish follow-up suggestion - "bu küçük detay sayfaya canlılık
 * katar"). Every number is a genuine query result, never a placeholder:
 *
 *  - `articlesCount` - `ArticleRepository.count()`, the exact same total
 *    the Admin Dashboard's "Total Articles" card already shows.
 *  - `releasesCount` / `resourcesCount` - summed real per-term match
 *    totals (one bounded `pageSize: 1` count-only query per term, all in
 *    parallel) over the SAME watched-tool/search-term lists the
 *    "Developer Releases"/"Developer Resources" widgets are themselves
 *    built from (`WATCHED_RELEASES`/`RESOURCE_SEARCH_TERMS`) - a real,
 *    if watch-list-scoped rather than site-wide, count; may double-count
 *    an article matching more than one term, a documented minor
 *    imprecision, never a fabricated figure.
 *  - `sourcesCount` - `SourceRepository.countActive()`.
 *  - `lastUpdatedRelative` - the most recently-inserted article's real
 *    `created_at`, formatted via `formatRelativeDate`.
 */
export async function getNewsExplorerStats(): Promise<NewsExplorerStats> {
  try {
    const { articles, sources } = await getRepositories();

    const [articlesCount, sourcesCount, releaseTotals, resourceTotals, latest] = await Promise.all([
      articles.count(),
      sources.countActive(),
      Promise.all(WATCHED_RELEASES.map((tool) => articles.search({ title: tool.name, page: 1, pageSize: 1 }).then((r) => r.total))),
      Promise.all(RESOURCE_SEARCH_TERMS.map((term) => articles.search({ searchText: term, page: 1, pageSize: 1 }).then((r) => r.total))),
      articles.search({ sortBy: "created_at", sortAscending: false, page: 1, pageSize: 1 }),
    ]);

    const latestRow = latest.items[0];
    return {
      articlesCount,
      releasesCount: releaseTotals.reduce((sum, value) => sum + value, 0),
      resourcesCount: resourceTotals.reduce((sum, value) => sum + value, 0),
      sourcesCount,
      lastUpdatedRelative: latestRow ? formatRelativeDate(latestRow.created_at) : "just now",
    };
  } catch (error) {
    console.error("[article-read-service] getNewsExplorerStats failed:", error);
    return { articlesCount: 0, releasesCount: 0, resourcesCount: 0, sourcesCount: 0, lastUpdatedRelative: "just now" };
  }
}

export type TopSourceOption = {
  id: string;
  name: string;
  count: number;
};

/**
 * The site's most-active real sources, most-covered first - backs the
 * News Explorer sidebar's Sources filter with actually-represented
 * sources instead of a hardcoded list. Tallies `source_id` across one
 * bounded, most-recent 300-row pool (3 pages of the schema's 100-row
 * cap, fetched in parallel) in application code - same "one shared pool,
 * bucketed in app code" convention `getTrendingCategories` already uses.
 */
export async function getTopSources(limit = 12): Promise<TopSourceOption[]> {
  try {
    const { articles } = await getRepositories();
    const pages = await Promise.all(
      [1, 2, 3].map((page) => articles.search({ sortBy: "published_at", page, pageSize: 100 }))
    );
    const pool = pages.flatMap((result) => result.items);

    const counts = new Map<string, number>();
    for (const row of pool) {
      counts.set(row.source_id, (counts.get(row.source_id) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([id, count]) => ({ id, name: resolveSourceName(id), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error("[article-read-service] getTopSources failed:", error);
    return [];
  }
}

/** Cap on how many article URLs `sitemap.ts` lists - a bounded, most-recent slice rather than the full table, matching the same "bounded candidate pool" convention `getAllArticlesForExport` (admin-article-service.ts) already uses for CSV export. Large sitemaps beyond this size should move to a sitemap index, which isn't needed at current article volumes. */
const SITEMAP_MAX_ARTICLES = 1000;

/** Most recently published article slugs, for `src/app/sitemap.ts` (Production Readiness phase). Read-only, reuses the existing search() pagination - no new repository method needed. */
export async function getSitemapEntries(): Promise<SitemapArticleEntry[]> {
  try {
    const { articles } = await getRepositories();
    const result = await articles.search({ page: 1, pageSize: SITEMAP_MAX_ARTICLES });
    return result.items.map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
  } catch (error) {
    console.error("[article-read-service] getSitemapEntries failed:", error);
    return [];
  }
}
