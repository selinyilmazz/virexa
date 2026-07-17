import type { Category } from "@/types/news";

/**
 * Maps every free-text category label a provider might use to one of
 * Virexa's normalized categories. Keys are the normalized `Category`;
 * values are the lowercase aliases providers are known to send.
 *
 * Extending coverage (e.g. a new RSS feed using "Robotics") only requires
 * adding an alias here — no provider or aggregator code needs to change.
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
  Games: ["games", "gaming", "esports", "video games"],
  World: ["world", "global", "international", "world news"],
  Science: ["science", "research", "space"],
  Security: ["security", "cybersecurity", "infosec", "cyber security"],
  Startup: ["startup", "startups", "venture capital", "funding"],
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
