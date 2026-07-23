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
  // "Games" = console/PC/general gaming industry content, independent from
  // "Mobile Games" below (stabilization pass, item 4: "Games and Mobile
  // Games should have independent article collections"). "console" is
  // deliberately NOT a bare alias here - "console" alone fires on
  // unrelated tech stories ("admin console", "developer console"), so
  // "game console"/"gaming console" are used instead for that signal.
  Games: [
    "games",
    "gaming",
    "esports",
    "video games",
    "video game",
    "pc games",
    "pc gaming",
    "game console",
    "gaming console",
    "steam",
    "epic games",
    "playstation",
    "xbox",
    "nintendo",
    "unity",
    "unreal engine",
    "game development",
    "game studio",
    "game studios",
    "gaming technology",
  ],
  // "Mobile Games" - checked before both "Games" and "Mobile" in
  // `CATEGORY_PRIORITY` below, so a title matching one of these (e.g.
  // "Unity Mobile", "Android Games") lands here rather than in the
  // broader parent category. "app store"/"google play" moved here from
  // "Mobile"'s aliases (removed below) rather than duplicated - the same
  // alias string can't safely belong to two categories at once
  // (`ALIAS_TO_CATEGORY` is a flat map keyed by alias, so a duplicate key
  // would just silently overwrite one category's mapping with the
  // other's, picked by object-key iteration order rather than intent).
  // "monetization"/"studio" are scoped with a "game"/"mobile" qualifier
  // (not left bare) since those bare words are common outside gaming
  // entirely (ad monetization, recording studio, etc).
  //
  // Redefinition (per explicit product direction): this category
  // represents the mobile game DEVELOPMENT ECOSYSTEM, not just
  // consumer/player mobile-gaming news - engines, frameworks, LiveOps,
  // monetization, ASO, user acquisition, analytics, studios, the
  // companies that dominate mobile games trade coverage, and dev/
  // industry-relevant mentions of major titles. Expanded below
  // accordingly. Two deliberate precision tradeoffs, called out rather
  // than silently made:
  //   - "King" (the Candy Crush publisher) is NOT added bare - "king" is
  //     an extremely common English word/name (royalty, chess, proper
  //     names) and would misfire constantly. Its legal name "king
  //     digital entertainment" and flagship title "candy crush" are used
  //     instead as safe proxies.
  //   - "Tencent" is scoped to "tencent games" rather than the bare
  //     company name - Tencent is a sprawling conglomerate (WeChat,
  //     cloud, fintech, AI investment), so the bare name would pull in
  //     many non-gaming stories.
  //   - "user acquisition"/"aso"/"mobile game analytics" are mobile-
  //     marketing jargon, not unique to games specifically (a SaaS growth
  //     article could in theory use "user acquisition") - accepted as a
  //     minor recall-over-precision tradeoff since `CATEGORY_PRIORITY`
  //     checks this category early and the currently-ingested feed set
  //     leans gaming/dev, not general SaaS marketing.
  "Mobile Games": [
    "mobile games",
    "mobile gaming",
    "mobile esports",
    "hyper-casual",
    "hypercasual",
    "hyper casual",
    "android games",
    "android gaming",
    "ios games",
    "ios gaming",
    "google play",
    "app store",
    "gacha game",
    "gacha games",
    // Development ecosystem: engines, frameworks, tooling.
    "mobile game development",
    "mobile game engine",
    "mobile game engines",
    "mobile game framework",
    "mobile game frameworks",
    "unity mobile",
    "unreal mobile",
    "cocos2d",
    "cocos creator",
    "mobile game ai",
    "ai mobile game development",
    // Business/growth side: monetization, LiveOps, ASO, UA, analytics.
    "game monetization",
    "mobile game monetization",
    "mobile monetization",
    "liveops",
    "live ops",
    "aso",
    "app store optimization",
    "user acquisition",
    "mobile game analytics",
    // Studios (own studios, not just published titles).
    "mobile game studio",
    "mobile game studios",
    "mobile gaming studio",
    "mobile gaming studios",
    "mobile studio",
    "mobile studios",
    // Major mobile game publishers/studios - real proper nouns, low
    // false-positive risk (see doc comment above for King/Tencent).
    "supercell",
    "netease",
    "rovio",
    "scopely",
    "hoyoverse",
    "mihoyo",
    "king digital entertainment",
    "tencent games",
    // Flagship titles - strongly gaming-specific, so dev/industry
    // coverage of these (updates, monetization moves, postmortems) is
    // captured without needing every general mention of the publisher.
    "candy crush",
    "clash of clans",
    "clash royale",
    "brawl stars",
    "pubg mobile",
    "genshin impact",
    "honor of kings",
    "coin master",
    "royal match",
    "pokemon go",
  ],
  World: ["world", "global", "international", "world news"],
  // "space" moved to its own Space category below - it used to live here
  // and made every space-exploration story land in Science instead.
  Science: ["science", "research", "biology", "physics", "chemistry", "genetics", "climate research"],
  Security: ["security", "cybersecurity", "infosec", "cyber security", "data breach", "ransomware", "malware", "hacker", "vulnerability"],
  Startup: ["startup", "startups", "venture capital", "funding round", "seed funding", "vc"],
  // Common language/framework names added (stabilization pass, item 5 -
  // "React Tutorial → Programming") so a title naming a specific
  // technology, not just the generic word "programming", still lands
  // here correctly.
  Programming: [
    "programming",
    "developer",
    "coding",
    "software engineering",
    "open source",
    "github",
    "framework",
    "programming language",
    "react",
    "react.js",
    "next.js",
    "vue",
    "angular",
    "svelte",
    "typescript",
    "javascript",
    "node.js",
    "python",
    "rust programming",
    "golang",
    "java",
    "kotlin",
    "swift",
  ],
  // "app store" intentionally removed (moved to "Mobile Games" above -
  // see that array's doc comment on why an alias can't live in both).
  Mobile: ["mobile", "smartphone", "android", "ios", "iphone"],
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
  // "Mobile Games" checked before the more generic "Games" and "Mobile"
  // so a title like "Mobile Games Revenue Surpasses Console Sales" lands
  // in the specific category rather than either of its broader parents.
  "Mobile Games",
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
 * one of the 13 actual `Category` values `articles.category` can hold
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
 * Stabilization pass: added "Mobile Games" as a 13th value, distinct from
 * the existing generic "Games" (console/PC gaming) and "Mobile"
 * (smartphones/hardware) categories - a real top-level Navigation item
 * matching AI/Programming/Cloud/Security/Open Source's treatment
 * (Explorer template, real Filters entry, Admin category dropdown,
 * Analytics breakdown, RSS categorization, Search, SEO/sitemap).
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
  { slug: "mobile-games", name: "Mobile Games" },
  { slug: "world", name: "World" },
  { slug: "science", name: "Science" },
  { slug: "security", name: "Security" },
  { slug: "startup", name: "Startup" },
  { slug: "programming", name: "Programming" },
  { slug: "mobile", name: "Mobile" },
  { slug: "robotics", name: "Robotics" },
  { slug: "space", name: "Space" },
];
