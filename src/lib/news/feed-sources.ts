/**
 * Registry of RSS feeds `RSSProvider` knows how to read. Each entry maps
 * a feed URL to a `sourceId` (resolved via `SOURCES` in `sources.ts`)
 * and a raw category label (normalized later via `normalizeCategory`).
 *
 * Per the task brief, the provider system needs to *support* Reuters
 * Technology, BBC Technology, TechCrunch, OpenAI Blog, Anthropic News,
 * Google DeepMind Blog, GitHub Blog, NVIDIA Blog, and Microsoft AI Blog
 * — it doesn't have to actively fetch every one of them yet. Feeds are
 * marked `enabled: false` with a `disabledReason` when no stable public
 * RSS endpoint could be confirmed; `RSSProvider` skips those without
 * attempting a request. Flip `enabled` to `true` (and fix the URL, if
 * needed) once a working feed is confirmed — no other code changes
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
    id: "openai-blog",
    label: "OpenAI Blog",
    url: "https://openai.com/news/rss.xml",
    sourceId: "openai",
    category: "AI",
    enabled: false,
    disabledReason: "OpenAI's blog does not currently expose a confirmed public RSS feed.",
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
    label: "Google DeepMind Blog",
    url: "https://deepmind.google/blog/rss.xml",
    sourceId: "google-deepmind",
    category: "AI",
    enabled: false,
    disabledReason: "DeepMind's blog does not currently expose a confirmed public RSS feed.",
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
    enabled: true,
  },
];
