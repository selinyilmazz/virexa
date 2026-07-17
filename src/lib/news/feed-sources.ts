/**
 * Registry of RSS feeds `RSSProvider` knows how to read. Each entry maps
 * a feed URL to a `sourceId` (resolved via `SOURCES` in `sources.ts`)
 * and a raw category label (normalized later via `normalizeCategory`).
 *
 * The provider system supports all of: Reuters Technology, BBC
 * Technology, TechCrunch, The Verge, Wired, Ars Technica, VentureBeat,
 * GitHub Blog, OpenAI News, Anthropic News, Google DeepMind, Microsoft
 * AI Blog (Tech Community candidate), Microsoft AI Blog (legacy,
 * retired), NVIDIA Blog, OpenAI Research, and Google Developers - it
 * doesn't have to actively fetch every one of them yet. Feeds are marked
 * `enabled: false` with a `disabledReason` when no stable public RSS
 * endpoint could be confirmed (or a previously-working endpoint has
 * since gone permanently offline); `RSSProvider` skips those without
 * attempting a request, so an unconfirmed or dead feed can never surface
 * an error to a user. Flip `enabled` to `true` (and fix the URL, if
 * needed) once a working feed is confirmed - no other code changes
 * required.
 */
export type FeedSourceConfig = {
  /** Stable identifier for this feed entry (not the same as `sourceId`). */
  id: string;
  label: string;
  url: string;
  /** Key into `SOURCES` (see `sources.ts`). */
  sourceId: string;
  /** Raw category label, normalized via `normalizeCategory()` at ingest time. */
  category: string;
  enabled: boolean;
  disabledReason?: string;
};

export const FEED_SOURCES: FeedSourceConfig[] = [
  {
    id: "reuters-technology",
    label: "Reuters Technology",
    url: "https://www.reutersagency.com/feed/?best-topics=tech",
    sourceId: "reuters",
    category: "Technology",
    enabled: false,
    disabledReason: "Reuters discontinued its public RSS feeds; no stable endpoint to poll.",
  },
  {
    id: "bbc-technology",
    label: "BBC Technology",
    url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
    sourceId: "bbc",
    category: "Technology",
    enabled: true,
  },
  {
    id: "techcrunch",
    label: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    sourceId: "techcrunch",
    category: "Technology",
    enabled: true,
  },
  {
    id: "the-verge",
    label: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    sourceId: "the-verge",
    category: "Technology",
    enabled: true,
  },
  {
    id: "wired",
    label: "Wired",
    url: "https://www.wired.com/feed/rss",
    sourceId: "wired",
    category: "Technology",
    enabled: true,
  },
  {
    id: "ars-technica",
    label: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    sourceId: "ars-technica",
    category: "Technology",
    enabled: true,
  },
  {
    id: "venturebeat",
    label: "VentureBeat",
    url: "https://venturebeat.com/feed/",
    sourceId: "venturebeat",
    category: "AI",
    enabled: true,
  },
  {
    id: "openai-blog",
    label: "OpenAI News",
    url: "https://openai.com/news/rss.xml",
    sourceId: "openai",
    category: "AI",
    enabled: false,
    disabledReason: "OpenAI's news page does not currently expose a confirmed public RSS feed.",
  },
  {
    id: "openai-research",
    label: "OpenAI Research",
    url: "https://openai.com/research/rss.xml",
    sourceId: "openai",
    category: "AI",
    enabled: false,
    disabledReason: "OpenAI's research page does not currently expose a confirmed public RSS feed.",
  },
  {
    id: "anthropic-news",
    label: "Anthropic News",
    url: "https://www.anthropic.com/news/rss.xml",
    sourceId: "anthropic",
    category: "AI",
    enabled: false,
    disabledReason: "Anthropic's news page does not currently expose a confirmed public RSS feed.",
  },
  {
    id: "google-deepmind-blog",
    label: "Google DeepMind",
    url: "https://deepmind.google/blog/rss.xml",
    sourceId: "google-deepmind",
    category: "AI",
    enabled: false,
    disabledReason: "DeepMind's blog does not currently expose a confirmed public RSS feed.",
  },
  {
    id: "google-developers",
    label: "Google Developers",
    url: "https://developers.googleblog.com/feeds/posts/default",
    sourceId: "google-developers",
    category: "Technology",
    enabled: true,
  },
  {
    id: "github-blog",
    label: "GitHub Blog",
    url: "https://github.blog/feed/",
    sourceId: "github-blog",
    category: "Technology",
    enabled: true,
  },
  {
    id: "nvidia-blog",
    label: "NVIDIA Blog",
    url: "https://blogs.nvidia.com/feed/",
    sourceId: "nvidia",
    category: "AI",
    enabled: true,
  },
  {
    id: "microsoft-ai-blog",
    label: "Microsoft AI Blog",
    url: "https://blogs.microsoft.com/ai/feed/",
    sourceId: "microsoft-ai",
    category: "AI",
    enabled: false,
    disabledReason:
      "Confirmed returning HTTP 410 Gone on every pipeline run (permanent removal, not a transient outage) - disabled rather than left enabled and silently failing every sync. See microsoft-ai-blog-techcommunity below for an unverified candidate replacement.",
  },
  {
    id: "microsoft-ai-blog-techcommunity",
    label: "Microsoft AI Platform Blog (Tech Community)",
    url: "https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=AIPlatformBlog",
    sourceId: "microsoft-ai",
    category: "AI",
    enabled: false,
    disabledReason:
      "Candidate replacement for the retired blogs.microsoft.com/ai/feed/ endpoint (Microsoft's Tech Community AI Platform board, standard board.id RSS pattern) - outbound network fetches were not available in this environment to confirm it resolves and returns valid RSS before enabling it. Verify manually, then flip enabled to true.",
  },
];
