import type { Category } from "@/types/news";

/**
 * Maps every free-text category label a provider might use to one of
 * Virexa's normalized categories. Keys are the normalized `Category`;
 * values are the lowercase aliases providers are known to send.
 *
 * Extending coverage (e.g. a new RSS feed using "Robotics") only requires
 * adding an alias here — no provider or aggregator code needs to change.
 * Also reused by `inferCategoryFromTitle()` below as its keyword
 * vocabulary, so adding an alias here improves both the raw
 * provider-label mapping AND title-based inference at once.
 */
const CATEGORY_ALIASES: Record<Category, string[]> = {
  Technology: ["technology", "tech"],
  Business: ["business", "finance", "economy", "markets", "economics"],
  AI: [
    "ai",
    "artificial intelligence",
    "machine learning",
    "generative ai",
    "genai",
    "ml",
    "llm",
    "deep learning",
  ],
  Games: ["games", "gaming", "esports", "video games", "video game"],
  World: ["world", "global", "international", "world news"],
  // "space" moved to its own Space category below - it used to live here
  // and made every space-exploration story land in Science instead.
  Science: ["science", "research", "biology", "physics", "chemistry", "genetics", "climate research"],
  Security: ["security", "cybersecurity", "infosec", "cyber security", "data breach", "ransomware", "malware", "hacker", "vulnerability"],
  Startup: ["startup", "startups", "venture capital", "funding round", "seed funding", "vc"],
  Programming: ["programming", "developer", "coding", "software engineering", "open source", "github", "framework", "programming language"],
  Mobile: ["mobile", "smartphone", "android", "ios", "iphone", "app store"],
  Robotics: ["robotics", "robot", "humanoid robot", "automation", "drone", "autonomous vehicle"],
  Space: ["space", "nasa", "spacex", "rocket", "satellite", "astronaut", "mars", "orbit", "exoplanet"],
};

/** Fallback category for labels that don't match any known alias. */
const DEFAULT_CATEGORY: Category = "World";

const ALIAS_TO_CATEGORY: Map<string, Category> = new Map(
  (Object.entries(CATEGORY_ALIASES) as [Category, string[]][]).flatMap(([category, aliases]) =>
    aliases.map((alias) => [alias, category] as const)
  )
);

/**
 * Normalizes a provider's raw category label (e.g. "Generative AI",
 * "Machine Learning") into Virexa's fixed category taxonomy. Unknown
 * labels fall back to `DEFAULT_CATEGORY` rather than throwing, since
 * provider data is inherently messy and the pipeline should keep running.
 */
export function normalizeCategory(rawCategory: string): Category {
  const normalized = rawCategory.trim().toLowerCase();
  return ALIAS_TO_CATEGORY.get(normalized) ?? DEFAULT_CATEGORY;
}

/**
 * Order in which `inferCategoryFromTitle()` checks candidate categories
 * when a title's keywords match more than one (e.g. a title containing
 * both "security" and "AI"). Narrower, more actionable categories are
 * checked first; `Technology` last, since its own aliases ("tech",
 * "technology") are common, generic words that would otherwise crowd out
 * a more specific match. This ordering is what makes the category
 * distribution realistic ("Mevcut mimariyi bozma" - no schema/provider
 * change, just a smarter category choice from data already on hand).
 */
const CATEGORY_PRIORITY: Category[] = [
  "Security",
  "Robotics",
  "Space",
  "Games",
  "Mobile",
  "Programming",
  "Business",
  "Startup",
  "World",
  "Science",
  "AI",
  "Technology",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Same alias vocabulary as `CATEGORY_ALIASES` above, precompiled into
 * word-boundary-safe regexes (`\bai\b`, not a bare substring match) so
 * "again"/"campaign"/"domain" can never spuriously match the "ai" alias,
 * and multi-word aliases ("machine learning", "video games") match as a
 * phrase. Built once at module load, not per call.
 */
const ALIAS_PATTERNS: Map<Category, RegExp[]> = new Map(
  (Object.entries(CATEGORY_ALIASES) as [Category, string[]][]).map(([category, aliases]) => [
    category,
    aliases.map((alias) => new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i")),
  ])
);

/**
 * Infers a category from an article's own title, using the same
 * `CATEGORY_ALIASES` vocabulary `normalizeCategory()` already uses for
 * provider labels. This is the deterministic, zero-new-dependency fix
 * for Virexa's structurally unreachable categories ("Kategori dağılımı
 * ... Games=0, Business=0, World=0"): every RSS feed in
 * `feed-sources.ts` (and `HackerNewsProvider`) is hardcoded to either
 * "Technology" or "AI" at the feed/provider level, so `normalizeCategory`
 * alone can never produce anything else - a games article syndicated
 * through a "Technology"-labeled feed stays "Technology" forever. Titles
 * carry real content signal `normalizeCategory` never sees, so checking
 * them first (see `NewsAggregator.normalizeProviderItem`) lets a genuine
 * gaming/business/security/etc. story land in its real category without
 * touching the feed registry, provider interfaces, or the database
 * schema.
 *
 * Returns `undefined` (not a default) when no keyword matches, so the
 * caller can fall back to the existing `normalizeCategory(item.category)`
 * behavior unchanged - this function only ever narrows a category, it
 * never invents one out of nothing.
 */
export function inferCategoryFromTitle(title: string): Category | undefined {
  for (const category of CATEGORY_PRIORITY) {
    const patterns = ALIAS_PATTERNS.get(category) ?? [];
    if (patterns.some((pattern) => pattern.test(title))) {
      return category;
    }
  }
  return undefined;
}

/**
 * Canonical slug <-> real-database-category mapping - the single source
 * of truth for every place that needs to turn a URL-friendly slug into
 * one of the 12 actual `Category` values `articles.category` can hold
 * (or vice versa).
 *
 * Product polishing phase, area 2: this used to be an 8-value list.
 * `src/data/categories.ts` (the taxonomy/breadcrumb/tag data for the
 * `/category/[slug]` browsing pages) already had 12 entries - including
 * "Robotics", "Mobile", "Programming", "Space" - each one already wired
 * to a real, paginated `searchCategoryArticles(category.name, ...)` DB
 * query (see `app/category/[slug]/page.tsx`), but the `Category` union
 * only had 8 values, so those 4 pages could structurally never show a
 * real article - `normalizeCategory`/`inferCategoryFromTitle` had
 * nowhere to route them. The `Category` union (`types/news.ts`) now
 * covers all 12, matching `src/data/categories.ts` exactly, so RSS
 * coverage for these categories (`feed-sources.ts`) actually reaches
 * the database. The former "Startups" (plural) entry in
 * `src/data/categories.ts` has also been fixed to the real, singular
 * "Startup" - it never matched any stored row before.
 *
 * Any UI that needs to filter/count the `articles` table by category
 * should import this list instead of reaching into the mock
 * category-page data - see `SearchFilters.tsx` and `app/search/page.tsx`.
 */
export const SEARCH_CATEGORY_SLUGS: { slug: string; name: Category }[] = [
  { slug: "technology", name: "Technology" },
  { slug: "business", name: "Business" },
  { slug: "ai", name: "AI" },
  { slug: "games", name: "Games" },
  { slug: "world", name: "World" },
  { slug: "science", name: "Science" },
  { slug: "security", name: "Security" },
  { slug: "startup", name: "Startup" },
  { slug: "programming", name: "Programming" },
  { slug: "mobile", name: "Mobile" },
  { slug: "robotics", name: "Robotics" },
  { slug: "space", name: "Space" },
];
