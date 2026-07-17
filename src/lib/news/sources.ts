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
};

export function getSourceById(sourceId: string): Source | undefined {
  return SOURCES[sourceId];
}
