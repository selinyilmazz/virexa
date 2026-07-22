import type { PulseTopicKey } from "@/lib/explorer/developer-pulse-data";

/**
 * Article Detail redesign - right sidebar's "Trending Now" card
 * (requirement: "changes depending on the article category"). Maps every
 * real `NewsCategory` value (`services/articles/article-read-service.ts`'s
 * `VALID_CATEGORIES`) onto the existing curated `PulseTopicKey` buckets
 * (`lib/explorer/developer-pulse-data.ts`) the News Explorer's "Developer
 * Pulse" widget already uses - reusing that same curated data rather than
 * inventing a second, parallel topic-keyword dataset. AI/Security/
 * Programming map 1:1 onto their matching bucket; Mobile and Robotics
 * (both developer-tool-adjacent) map onto "programming"; every other
 * category (Technology, Business, Games, World, Science, Startup, Space)
 * falls back to "general" - the same catch-all bucket `/most-read` and
 * `/cloud`'s non-specialized pages already use.
 */
export function resolvePulseTopicForCategory(category: string): PulseTopicKey {
  switch (category) {
    case "AI":
      return "ai";
    case "Security":
      return "security";
    case "Programming":
    case "Mobile":
    case "Robotics":
      return "programming";
    default:
      return "general";
  }
}

export type DiscussionPlatform = "hackernews" | "reddit" | "x" | "github";

export type TopDiscussionEntry = {
  platform: DiscussionPlatform;
  title: string;
  likes: number;
  comments: number;
  /** Real, working URL to that community (front page / subreddit / search) - never a fake permalink, same convention as `DEVELOPER_PULSE_DATA`. */
  url: string;
};

/**
 * "Top Discussions" sidebar card (Article Detail redesign) - the most
 * discussed developer conversations for the article's topic bucket,
 * sourced from real communities (Hacker News, Reddit, X, GitHub
 * Discussions). Same honesty convention as `DEVELOPER_PULSE_DATA`
 * (that file's doc comment applies here too): there is no real social-
 * listening integration wired up, so titles/likes/comments are
 * realistic, illustrative placeholders rather than live-fetched posts -
 * but every `url` points at a REAL, currently-working community page,
 * never a fabricated permalink to a post that doesn't exist. Kept as its
 * own small file (rather than folding into `developer-pulse-data.ts`)
 * so this purely-additive Article Detail feature never has to touch -
 * or risk regressing - the News Explorer pages that already depend on
 * that file's existing shape.
 */
export const TOP_DISCUSSIONS: Record<PulseTopicKey, TopDiscussionEntry[]> = {
  ai: [
    { platform: "hackernews", title: "Claude Code is quietly replacing whole engineering workflows", likes: 15200, comments: 1100, url: "https://news.ycombinator.com/" },
    { platform: "reddit", title: "GPT-5.5's API pricing is reshaping how startups build AI products", likes: 9400, comments: 612, url: "https://www.reddit.com/r/artificial/" },
    { platform: "x", title: "MCP adoption is accelerating across every major AI coding tool", likes: 7800, comments: 340, url: "https://x.com/search?q=%23MCP" },
  ],
  programming: [
    { platform: "github", title: "Discussion: is Next.js 16's caching model actually simpler?", likes: 4300, comments: 268, url: "https://github.com/vercel/next.js/discussions" },
    { platform: "hackernews", title: "React Compiler adoption is further along than people think", likes: 6700, comments: 421, url: "https://news.ycombinator.com/" },
    { platform: "reddit", title: "TypeScript 5.9's faster incremental builds, benchmarked", likes: 5100, comments: 233, url: "https://www.reddit.com/r/typescript/" },
  ],
  security: [
    { platform: "reddit", title: "A critical zero-day is being actively exploited in the wild", likes: 15200, comments: 1100, url: "https://www.reddit.com/r/netsec/" },
    { platform: "hackernews", title: "OWASP's latest Top 10 draft is already controversial", likes: 6200, comments: 489, url: "https://news.ycombinator.com/" },
    { platform: "x", title: "Bug bounty payouts hit a new high this quarter", likes: 4100, comments: 187, url: "https://x.com/search?q=%23BugBounty" },
  ],
  cloud: [
    { platform: "hackernews", title: "Kubernetes complexity is pushing teams back to boring servers", likes: 8100, comments: 634, url: "https://news.ycombinator.com/" },
    { platform: "reddit", title: "Terraform vs Pulumi in 2026 - what actually changed", likes: 3900, comments: 271, url: "https://www.reddit.com/r/devops/" },
    { platform: "github", title: "Discussion: serverless cold starts are still the #1 complaint", likes: 2600, comments: 154, url: "https://github.com/orgs/community/discussions" },
  ],
  "open-source": [
    { platform: "reddit", title: "Shadcn/ui basically became the default React component library", likes: 10300, comments: 701, url: "https://www.reddit.com/r/webdev/" },
    { platform: "github", title: "Discussion: should more projects adopt a Biome-first toolchain?", likes: 3300, comments: 198, url: "https://github.com/biomejs/biome/discussions" },
    { platform: "hackernews", title: "Supabase's open-source stack keeps eating Firebase's lunch", likes: 5400, comments: 362, url: "https://news.ycombinator.com/" },
  ],
  general: [
    { platform: "hackernews", title: "GPT-5.5's API pricing is reshaping how startups build AI products", likes: 14100, comments: 932, url: "https://news.ycombinator.com/" },
    { platform: "x", title: "Next.js 16 and the shrinking gap between dev and prod builds", likes: 6200, comments: 287, url: "https://x.com/search?q=%23Nextjs" },
    { platform: "reddit", title: "What developer trend actually mattered this year?", likes: 5800, comments: 640, url: "https://www.reddit.com/r/programming/" },
  ],
};
