import type { Source } from "@/types/news";

/**
 * Registry of every publisher Virexa's pipeline currently knows about.
 * `NewsProvider` implementations reference a source by `id` via
 * `ProviderNewsItem.sourceId`; the aggregator resolves the full `Source`
 * object from this table when normalizing raw items.
 *
 * trustScore (0-100) is a starting editorial estimate — wire services and
 * major broadcasters sit highest, official company/lab blogs are treated
 * as authoritative for their own announcements, and independent tech
 * outlets sit in the upper-mid range. This is meant to be tuned over time,
 * not a permanent ranking.
 *
 * `logo` is only set for sources with a matching asset under
 * `public/logos/`. Sources without one intentionally fall back to
 * `DEFAULT_SOURCE_LOGO` via `getSourceLogo()` (see `source-logos.ts`) —
 * that's the "logo bulunamazsa default logo göster" behavior in practice.
 */
export const SOURCES: Record<string, Source> = {
  reuters: {
    id: "reuters",
    name: "Reuters",
    website: "https://www.reuters.com",
    logo: "/logos/reuters.svg",
    country: "GB",
    language: "en",
    trustScore: 98,
    official: false,
  },
  "associated-press": {
    id: "associated-press",
    name: "Associated Press",
    website: "https://apnews.com",
    country: "US",
    language: "en",
    trustScore: 98,
    official: false,
  },
  bloomberg: {
    id: "bloomberg",
    name: "Bloomberg",
    website: "https://www.bloomberg.com",
    logo: "/logos/bloomberg.svg",
    country: "US",
    language: "en",
    trustScore: 95,
    official: false,
  },
  bbc: {
    id: "bbc",
    name: "BBC",
    website: "https://www.bbc.com",
    logo: "/logos/bbc.svg",
    country: "GB",
    language: "en",
    trustScore: 96,
    official: false,
  },
  cnbc: {
    id: "cnbc",
    name: "CNBC",
    website: "https://www.cnbc.com",
    country: "US",
    language: "en",
    trustScore: 90,
    official: false,
  },
  techcrunch: {
    id: "techcrunch",
    name: "TechCrunch",
    website: "https://techcrunch.com",
    logo: "/logos/techcrunch.svg",
    country: "US",
    language: "en",
    trustScore: 85,
    official: false,
  },
  "the-verge": {
    id: "the-verge",
    name: "The Verge",
    website: "https://www.theverge.com",
    logo: "/logos/the-verge.svg",
    country: "US",
    language: "en",
    trustScore: 85,
    official: false,
  },
  wired: {
    id: "wired",
    name: "Wired",
    website: "https://www.wired.com",
    logo: "/logos/wired.svg",
    country: "US",
    language: "en",
    trustScore: 84,
    official: false,
  },
  "ars-technica": {
    id: "ars-technica",
    name: "Ars Technica",
    website: "https://arstechnica.com",
    country: "US",
    language: "en",
    trustScore: 88,
    official: false,
  },
  venturebeat: {
    id: "venturebeat",
    name: "VentureBeat",
    website: "https://venturebeat.com",
    country: "US",
    language: "en",
    trustScore: 80,
    official: false,
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    website: "https://openai.com/news",
    logo: "/logos/openai.svg",
    country: "US",
    language: "en",
    trustScore: 92,
    official: true,
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    website: "https://www.anthropic.com/news",
    logo: "/logos/anthropic.svg",
    country: "US",
    language: "en",
    trustScore: 92,
    official: true,
  },
  "google-deepmind": {
    id: "google-deepmind",
    name: "Google DeepMind",
    website: "https://deepmind.google/discover/blog",
    logo: "/logos/google.svg",
    country: "GB",
    language: "en",
    trustScore: 92,
    official: true,
  },
  "microsoft-ai": {
    id: "microsoft-ai",
    name: "Microsoft AI",
    website: "https://blogs.microsoft.com/ai",
    logo: "/logos/microsoft.svg",
    country: "US",
    language: "en",
    trustScore: 90,
    official: true,
  },
  "meta-ai": {
    id: "meta-ai",
    name: "Meta AI",
    website: "https://ai.meta.com/blog",
    country: "US",
    language: "en",
    trustScore: 90,
    official: true,
  },
  "google-developers": {
    id: "google-developers",
    name: "Google Developers",
    website: "https://developers.googleblog.com",
    logo: "/logos/google.svg",
    country: "US",
    language: "en",
    trustScore: 89,
    official: true,
  },
  nvidia: {
    id: "nvidia",
    name: "NVIDIA",
    website: "https://blogs.nvidia.com",
    logo: "/logos/nvidia.svg",
    country: "US",
    language: "en",
    trustScore: 90,
    official: true,
  },
  "github-blog": {
    id: "github-blog",
    name: "GitHub Blog",
    website: "https://github.blog",
    logo: "/logos/github.svg",
    country: "US",
    language: "en",
    trustScore: 88,
    official: true,
  },
  /**
   * Hacker News (news.ycombinator.com) - a community link-aggregator,
   * not a first-party publisher (`official: false`, matching how
   * TechCrunch/The Verge/etc. are classified, not the OpenAI/Anthropic/
   * NVIDIA-style official blogs). Every article ingested via
   * `HackerNewsProvider` uses THIS source id regardless of which
   * external site the story actually links to - "Hacker News yeni bir
   * source olarak... diğer kaynaklarla aynı davranışı göstersin" means
   * the aggregator itself is the source of record, same as how a wire
   * service is credited even though its stories run in many outlets.
   * trustScore (65) sits deliberately between the generic `web` fallback
   * (55) and the independent editorial outlets (80-88): HN's community
   * upvote/curation process has real signal, but it's user-generated
   * content, not edited journalism, so it shouldn't outrank a vetted
   * outlet on trust alone. Tunable later, same as every other entry
   * here. No `logo` asset exists yet - falls back to
   * `DEFAULT_SOURCE_LOGO`, same as `associated-press`/`cnbc`/etc.
   */
  "hacker-news": {
    id: "hacker-news",
    name: "Hacker News",
    website: "https://news.ycombinator.com",
    country: "US",
    language: "en",
    trustScore: 65,
    official: false,
  },
  // --- Product polishing phase, area 2: sources added for previously
  // under-covered categories (Business/Games/World/Science/Security/
  // Startup/Programming/Mobile/Robotics/Space) - see feed-sources.ts.
  "krebs-on-security": {
    id: "krebs-on-security",
    name: "Krebs on Security",
    website: "https://krebsonsecurity.com",
    country: "US",
    language: "en",
    trustScore: 88,
    official: false,
  },
  nasa: {
    id: "nasa",
    name: "NASA",
    website: "https://www.nasa.gov",
    country: "US",
    language: "en",
    trustScore: 97,
    official: true,
  },
  ign: {
    id: "ign",
    name: "IGN",
    website: "https://www.ign.com",
    country: "US",
    language: "en",
    trustScore: 78,
    official: false,
  },
  polygon: {
    id: "polygon",
    name: "Polygon",
    website: "https://www.polygon.com",
    country: "US",
    language: "en",
    trustScore: 82,
    official: false,
  },
  // --- Mobile Games ecosystem expansion: trade/industry-side outlets,
  // not general consumer gaming press.
  //
  // NOTE on PocketGamer.biz: originally registered here pending manual
  // verification (see prior version of this comment), but live
  // verification found no working public RSS endpoint - every plausible
  // path (/rss, /rss/, /feed, /feed/, /rss.xml, /feed.xml, /news/rss,
  // /news/index.rss) returned empty/404, and the site's markup exposes no
  // discoverable feed link. The entry has been removed rather than left
  // as a permanently-broken placeholder; `deconstructor-of-fun` and
  // `touch-arcade` below (both verified live) already cover this same
  // "mobile games industry" niche.
  "deconstructor-of-fun": {
    id: "deconstructor-of-fun",
    name: "Deconstructor of Fun",
    website: "https://www.deconstructoroffun.com",
    country: "US",
    language: "en",
    trustScore: 75,
    official: false,
  },
  "touch-arcade": {
    id: "touch-arcade",
    name: "TouchArcade",
    website: "https://toucharcade.com",
    country: "US",
    language: "en",
    trustScore: 76,
    official: false,
  },
  // --- Mobile Games ecosystem expansion, round 2: technical/developer
  // resources (engines, platforms, official docs blogs), not just news -
  // "Mobile Games sadece haber değil... teknik kaynaklardan da beslensin"
  // (should also draw from technical sources, not just news). Each entry
  // below was live-verified to return real, current RSS/Atom content
  // before being enabled - see feed-sources.ts for the exact URLs tried
  // and what was swapped out when the requested source had no public
  // feed (Unity Blog, GDC, PocketGamer.biz).
  "unity-discussions": {
    id: "unity-discussions",
    name: "Unity Discussions",
    website: "https://discussions.unity.com",
    country: "US",
    language: "en",
    // Community forum, not an edited/official publication - same
    // reasoning as `hacker-news`'s trustScore, not full official-blog
    // trust despite being Unity-hosted.
    trustScore: 68,
    official: false,
  },
  "unreal-engine": {
    id: "unreal-engine",
    name: "Unreal Engine",
    website: "https://www.unrealengine.com",
    country: "US",
    language: "en",
    trustScore: 90,
    official: true,
  },
  "android-developers": {
    id: "android-developers",
    name: "Android Developers Blog",
    website: "https://android-developers.googleblog.com",
    logo: "/logos/google.svg",
    country: "US",
    language: "en",
    trustScore: 90,
    official: true,
  },
  "firebase": {
    id: "firebase",
    name: "Firebase Blog",
    website: "https://firebase.blog",
    logo: "/logos/google.svg",
    country: "US",
    language: "en",
    trustScore: 89,
    official: true,
  },
  "apple-developer": {
    id: "apple-developer",
    name: "Apple Developer News",
    website: "https://developer.apple.com/news",
    country: "US",
    language: "en",
    trustScore: 91,
    official: true,
  },
  "game-developer": {
    id: "game-developer",
    name: "Game Developer",
    website: "https://www.gamedeveloper.com",
    country: "US",
    language: "en",
    trustScore: 83,
    official: false,
  },
  "stack-overflow-blog": {
    id: "stack-overflow-blog",
    name: "Stack Overflow Blog",
    website: "https://stackoverflow.blog",
    country: "US",
    language: "en",
    trustScore: 85,
    official: true,
  },
  "android-authority": {
    id: "android-authority",
    name: "Android Authority",
    website: "https://www.androidauthority.com",
    country: "US",
    language: "en",
    trustScore: 78,
    official: false,
  },
  forbes: {
    id: "forbes",
    name: "Forbes",
    website: "https://www.forbes.com",
    country: "US",
    language: "en",
    trustScore: 82,
    official: false,
  },
  "the-hacker-news": {
    id: "the-hacker-news",
    name: "The Hacker News",
    website: "https://thehackernews.com",
    country: "IN",
    language: "en",
    trustScore: 80,
    official: false,
  },
  "science-daily": {
    id: "science-daily",
    name: "ScienceDaily",
    website: "https://www.sciencedaily.com",
    country: "US",
    language: "en",
    trustScore: 80,
    official: false,
  },
  "the-robot-report": {
    id: "the-robot-report",
    name: "The Robot Report",
    website: "https://www.therobotreport.com",
    country: "US",
    language: "en",
    trustScore: 78,
    official: false,
  },
  "al-jazeera": {
    id: "al-jazeera",
    name: "Al Jazeera",
    website: "https://www.aljazeera.com",
    country: "QA",
    language: "en",
    trustScore: 85,
    official: false,
  },
  /**
   * Fallback for API-provider results (NewsAPI, GNews) whose reported
   * outlet name doesn't match anything in this registry - those APIs
   * aggregate thousands of publishers, far more than Virexa curates by
   * hand. Kept deliberately mid/low trust so an unrecognized source
   * never outranks a known, vetted one; see `findSourceIdByName` below.
   */
  web: {
    id: "web",
    name: "Web",
    website: "",
    country: "US",
    language: "en",
    trustScore: 55,
    official: false,
  },
};

export function getSourceById(sourceId: string): Source | undefined {
  return SOURCES[sourceId];
}

/** Lowercased source name -> id, plus a few known aliases API providers commonly use. */
const NAME_TO_SOURCE_ID: Map<string, string> = new Map([
  ...Object.values(SOURCES).map((source) => [source.name.toLowerCase(), source.id] as const),
  ["bbc news", "bbc"],
  ["bbc.com", "bbc"],
  ["reuters.com", "reuters"],
  ["the verge", "the-verge"],
  ["ars technica", "ars-technica"],
  ["techcrunch.com", "techcrunch"],
  ["google ai blog", "google-deepmind"],
  ["deepmind", "google-deepmind"],
  ["nvidia blog", "nvidia"],
  ["github", "github-blog"],
  ["hacker news", "hacker-news"],
  ["ycombinator", "hacker-news"],
  ["y combinator", "hacker-news"],
]);

/**
 * Resolves a free-text publisher name (as returned by NewsAPI/GNews)
 * to a known `sourceId`, falling back to the generic `"web"` source
 * when nothing matches - so an aggregator-sourced article from an
 * outlet Virexa doesn't specifically curate still gets displayed
 * (with a conservative trust score) instead of being silently dropped.
 */
export function findSourceIdByName(name: string | undefined | null): string {
  if (!name) return "web";
  return NAME_TO_SOURCE_ID.get(name.trim().toLowerCase()) ?? "web";
}
