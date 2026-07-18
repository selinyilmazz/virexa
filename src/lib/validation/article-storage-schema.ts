import { z } from "zod";

/**
 * Server-side validation for everything written to the Article Storage
 * tables (see `supabase/migrations/0002_article_storage.sql`). Used by
 * the repositories (`src/repositories/article-*.ts`) right before a
 * write, so a malformed article coming out of the news/AI pipeline is
 * rejected before it ever reaches the database ("Eksik haber database'e
 * yazılmasın") instead of silently inserting a broken row.
 */

export const articleSourceInputSchema = z.object({
  id: z.string().trim().min(1, "Source id is required."),
  name: z.string().trim().min(1, "Source name is required."),
  domain: z.string().trim().default(""),
  logo: z.string().trim().nullable().optional(),
  official: z.boolean().default(false),
  country: z.string().trim().default(""),
  trustScore: z.number().int().min(0).max(100).default(0),
  active: z.boolean().default(true),
});

export type ArticleSourceInput = z.infer<typeof articleSourceInputSchema>;

export const articleInputSchema = z.object({
  id: z.string().trim().min(1, "Article id is required."),
  slug: z.string().trim().min(1, "Article slug is required."),
  title: z.string().trim().min(1, "Article title is required."),
  description: z.string().trim().default(""),
  content: z.string().trim().nullable().optional(),
  url: z.string().trim().url("Article url must be a valid URL."),
  /** Discussion/comments page URL, distinct from `url` - only ever populated by HackerNewsProvider. */
  discussionUrl: z.string().trim().url("discussionUrl must be a valid URL.").nullable().optional(),
  imageUrl: z.string().trim().default(""),
  /** Which stage of the image pipeline supplied `imageUrl` - observability only. */
  imageSource: z.string().trim().nullable().optional(),
  publishedAt: z.string().trim().min(1, "publishedAt is required."),
  language: z.string().trim().default("en"),
  country: z.string().trim().default(""),
  category: z.string().trim().min(1, "Article category is required."),
  author: z.string().trim().nullable().optional(),
  tags: z.array(z.string().trim()).default([]),
  readingTime: z.number().int().min(1).default(1),
  trustScore: z.number().int().min(0).max(100).default(0),
  trendingScore: z.number().int().min(0).default(0),
  sourceId: z.string().trim().min(1, "sourceId is required."),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;

export const articleAIInputSchema = z.object({
  articleId: z.string().trim().min(1, "articleId is required."),
  summary: z.string().trim().nullable().optional(),
  tldr: z.object({ title: z.string(), bullets: z.array(z.string()) }).nullable().optional(),
  tags: z.array(z.string().trim()).default([]),
  sentiment: z.object({ label: z.string(), confidence: z.number().min(0).max(1) }).nullable().optional(),
  bias: z.object({ level: z.string(), confidence: z.number().min(0).max(1) }).nullable().optional(),
  provider: z.string().trim().min(1, "provider is required."),
  model: z.string().trim().default(""),
  promptVersion: z.string().trim().default(""),
  cacheKey: z.string().trim().min(1, "cacheKey is required."),
});

export type ArticleAIInput = z.infer<typeof articleAIInputSchema>;

export const articleSearchParamsSchema = z.object({
  title: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
  sourceId: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  /** Multi-category browse filter (`.in("category", ...)`) - used by the public /search page's filter-only (no text query) browse path, added alongside `categories` for `fullTextSearchParamsSchema` below in the product polishing phase. `category` (singular) stays for every other existing caller. */
  categories: z.array(z.string().trim().min(1)).min(1).optional(),
  language: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  dateFrom: z.string().trim().min(1).optional(),
  dateTo: z.string().trim().min(1).optional(),
  /** Defaults to newest-first by publish date; "trending_score" powers the paginated `/most-read` page. */
  sortBy: z.enum(["published_at", "trending_score"]).default("published_at"),
  /** Sort direction for `sortBy` - defaults to descending (newest/highest first). Set `true` for an ascending ("Oldest") sort, used by the /search page's filter-only browse path. */
  sortAscending: z.boolean().default(false),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),

  // --- Admin Articles Management additions (additive, all optional) ---
  /** Partial, case-insensitive match on the article's source URL. */
  url: z.string().trim().min(1).optional(),
  minTrustScore: z.number().int().min(0).max(100).optional(),
  maxTrustScore: z.number().int().min(0).max(100).optional(),
  minTrendingScore: z.number().int().min(0).optional(),
  maxTrendingScore: z.number().int().min(0).optional(),
  /**
   * Free-text admin search - matched against title, url, and tags in one
   * query (see `ArticleRepository.search()`'s `.or()` clause). Kept
   * separate from `title` above so the public search page's exact
   * "title only" behavior is untouched.
   */
  searchText: z.string().trim().min(1).optional(),
  /** Source ids whose name matched `searchText` - folded into the same `.or()` clause as an additional "search by source name" condition. Resolved by the admin service layer, not this schema. */
  searchSourceIds: z.array(z.string().trim().min(1)).optional(),
});

export type ArticleSearchParams = z.infer<typeof articleSearchParamsSchema>;

/**
 * Params for `ArticleRepository.fullTextSearch()` (News Engine & Search
 * production-readiness phase) - a real PostgreSQL full-text search
 * across title/description/content/tags/author/category/AI-summary/
 * TLDR/source-name via the `search_articles_fts` Postgres function (see
 * `supabase/migrations/0004_full_text_search.sql`), NOT the ILIKE-based
 * `articleSearchParamsSchema.title` filter above - that one stays
 * exactly as-is for every other existing caller (admin search, etc.).
 * `query` supports both word and phrase search (`websearch_to_tsquery`
 * on the database side handles quoting/operators).
 *
 * `category` (single) and `categories` (array) both map onto
 * `search_articles_fts`'s `filter_category`/`filter_categories`
 * parameters (see `supabase/migrations/0007_search_multi_category.sql`)
 * - `categories` is what the public search page's multi-select
 * Category checkboxes actually use; `category` stays for any other
 * caller that only ever needs a single exact category.
 */
export const fullTextSearchParamsSchema = z.object({
  query: z.string().trim().min(1, "A search query is required."),
  sourceId: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  categories: z.array(z.string().trim().min(1)).min(1).optional(),
  language: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
  dateFrom: z.string().trim().min(1).optional(),
  dateTo: z.string().trim().min(1).optional(),
  /** Result order - 'relevance' (default, rank-based), 'newest', or 'oldest' by publish date. Maps onto `search_articles_fts`'s `sort_by` parameter (see `supabase/migrations/0008_search_sort_and_title_boost.sql`). Powers the /search page's Sort control. */
  sortBy: z.enum(["relevance", "newest", "oldest"]).default("relevance"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
});

export type FullTextSearchParams = z.infer<typeof fullTextSearchParamsSchema>;
