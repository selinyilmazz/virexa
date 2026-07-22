/**
 * Curated CONFIGURATION for two homepage widgets - "Latest Releases" and
 * "Resources & Career Hub" (homepage redesign, matching a provided
 * reference layout). Neither list below is fake/static news content:
 * every row these widgets actually render comes from a real article in
 * the `articles` table, found by searching for these terms via
 * `article-read-service.ts`'s `getLatestReleases()`/`getResourcesNews()`.
 * What's curated here is only the SEARCH INPUT (which tool/topic to look
 * for) and small DISPLAY LABELS (a generic one-line description, a badge
 * color) - never a headline, a version number, or a date. If no matching
 * article exists in the database for a given tool/keyword, that row is
 * simply omitted - nothing here is ever shown without a real, current
 * article backing it up.
 */

export type WatchedRelease = {
  /** Display name - also the primary search term against `articles.title`. */
  name: string;
  /** Generic, evergreen one-line description (not derived from any article) - same role as a tagline under a logo, e.g. "The React Framework". */
  subtitle: string;
  /** Short glyph rendered in the logo tile - a single character/symbol, not a real brand asset (avoids bundling third-party logo files). */
  glyph: string;
  /** Logo tile background color (a light, brand-adjacent tint, matching `CompanyTicker`'s existing `logoBg` pattern). */
  tileBg: string;
  /** Logo tile text/glyph color. */
  tileColor: string;
  /** Additional title substrings to try if `name` itself finds nothing (e.g. a common short form). */
  aliases?: string[];
};

/**
 * Frameworks/tools/languages watched for the "Latest Releases" widget,
 * in the fixed display order the widget renders them (when a real match
 * exists for each - see the widget's own doc comment).
 */
export const WATCHED_RELEASES: WatchedRelease[] = [
  { name: "Next.js", subtitle: "The React Framework", glyph: "N", tileBg: "#000000", tileColor: "#ffffff", aliases: ["Next 15", "Next 16"] },
  { name: "React", subtitle: "The library for web and native", glyph: "⚛", tileBg: "#e6f4fe", tileColor: "#087ea4" },
  { name: "Node.js", subtitle: "JavaScript runtime", glyph: "⬡", tileBg: "#e7f6e9", tileColor: "#3c873a" },
  { name: "TypeScript", subtitle: "Typed JavaScript", glyph: "TS", tileBg: "#dbeafe", tileColor: "#3178c6" },
  { name: "Docker", subtitle: "Container platform", glyph: "🐳", tileBg: "#e6f4fd", tileColor: "#1d63ed" },
  { name: "Rust", subtitle: "Systems programming language", glyph: "R", tileBg: "#fdf0e3", tileColor: "#a35127" },
  { name: "Python", subtitle: "General-purpose language", glyph: "Py", tileBg: "#fef7e0", tileColor: "#2b6a99" },
  { name: "Kubernetes", subtitle: "Container orchestration", glyph: "K", tileBg: "#e6ecfc", tileColor: "#326ce5" },
  { name: "VS Code", subtitle: "Code editor", glyph: "VS", tileBg: "#e6f1fd", tileColor: "#007acc", aliases: ["Visual Studio Code"] },
  { name: "Flutter", subtitle: "UI toolkit for all platforms", glyph: "F", tileBg: "#e6f5fd", tileColor: "#0468d7" },
];

/**
 * Search terms watched for the "Resources & Career Hub" widget - free/
 * certification/career-oriented developer news, matched against
 * `articles.title`/`url`/`tags` via `ArticleRepository.search()`'s
 * `searchText` filter (same plain ILIKE match the admin Articles list
 * already uses, not full-text ranking - see `getResourcesNews()`).
 */
export const RESOURCE_SEARCH_TERMS: string[] = [
  "certification",
  "certified",
  "free license",
  "free course",
  "scholarship",
  "learning path",
  "bootcamp",
];
