/**
 * Mock backing data for the Explorer sidebar's "Developer Pulse" widget -
 * "what developers are currently discussing," scoped to whatever page
 * you're on. Replaces the old three-widget sidebar (Trending Topics /
 * Most Read Today / Top Sources), which was real-data-backed but, per
 * user feedback, wasn't providing enough value.
 *
 * There is no real social-listening integration yet (no X/Reddit/Hacker
 * News/Bluesky API wired up) - per the user's explicit instruction, this
 * uses realistic placeholder topics/quotes/counts instead of either
 * fabricating a fake "real" data source or leaving the panel empty.
 * `DeveloperPulse.tsx` is the only place this ever renders, and every
 * value it needs lives in one typed record here, so swapping this file's
 * contents for a real `getDeveloperPulse(topic)` service call later is a
 * drop-in change with no UI rework required.
 *
 * The "Top Discussion" card's `url` intentionally points at a REAL,
 * working destination (the actual Hacker News front page, or the actual
 * subreddit) rather than a fake permalink to a post that doesn't exist -
 * the quote/engagement numbers are illustrative, but the "View
 * discussion" link never leads nowhere.
 */

export type PulseTopicKey = "ai" | "programming" | "security" | "cloud" | "open-source" | "general";

export type PulseTrend = "up" | "down" | "flat";

export type PulseTopicEntry = {
  name: string;
  trend: PulseTrend;
  /** Raw discussion count - formatted (e.g. "8.2K") by `DeveloperPulse`. */
  discussions: number;
  /** Tailwind bg class for the small colored rank/heat indicator dot next to the topic name. */
  dotColor: string;
};

export type PulseDiscussion = {
  /** Real, recognizable community name (Hacker News, a subreddit, etc.) - matches this app's "use the brand's real name/color" convention even though the specific post is illustrative. */
  source: string;
  sourceInitials: string;
  /** Tailwind bg class using that community's real brand color. */
  sourceColor: string;
  quote: string;
  likes: number;
  comments: number;
  /** Real, working URL to that community (front page / subreddit) - never a fake permalink. */
  url: string;
};

export type PulseTopicData = {
  topics: PulseTopicEntry[];
  discussion: PulseDiscussion;
};

export const DEVELOPER_PULSE_DATA: Record<PulseTopicKey, PulseTopicData> = {
  ai: {
    topics: [
      { name: "GPT-5.5 API", trend: "up", discussions: 8200, dotColor: "bg-orange-500" },
      { name: "Claude Code", trend: "up", discussions: 5100, dotColor: "bg-emerald-500" },
      { name: "Gemini 3", trend: "up", discussions: 4400, dotColor: "bg-blue-500" },
      { name: "MCP", trend: "flat", discussions: 3100, dotColor: "bg-violet-500" },
      { name: "OpenAI", trend: "up", discussions: 2600, dotColor: "bg-amber-500" },
      { name: "LangChain", trend: "down", discussions: 1800, dotColor: "bg-rose-500" },
    ],
    discussion: {
      source: "Hacker News",
      sourceInitials: "HN",
      sourceColor: "bg-[#FF6600]",
      quote: "Claude Code is replacing Cursor for many developers",
      likes: 12800,
      comments: 846,
      url: "https://news.ycombinator.com/",
    },
  },
  programming: {
    topics: [
      { name: "React 19", trend: "up", discussions: 6700, dotColor: "bg-orange-500" },
      { name: "Next.js 16", trend: "up", discussions: 5300, dotColor: "bg-emerald-500" },
      { name: "TypeScript", trend: "up", discussions: 4200, dotColor: "bg-blue-500" },
      { name: "Node.js", trend: "flat", discussions: 2900, dotColor: "bg-violet-500" },
      { name: "Rust", trend: "up", discussions: 2400, dotColor: "bg-amber-500" },
      { name: "Bun", trend: "down", discussions: 1600, dotColor: "bg-rose-500" },
    ],
    discussion: {
      source: "r/programming",
      sourceInitials: "r/",
      sourceColor: "bg-[#FF4500]",
      quote: "Next.js 16's new caching model is a huge DX win",
      likes: 9400,
      comments: 512,
      url: "https://www.reddit.com/r/programming/",
    },
  },
  security: {
    topics: [
      { name: "Zero-Day", trend: "up", discussions: 7500, dotColor: "bg-orange-500" },
      { name: "OWASP", trend: "up", discussions: 4800, dotColor: "bg-emerald-500" },
      { name: "CVEs", trend: "up", discussions: 3900, dotColor: "bg-blue-500" },
      { name: "Cloudflare", trend: "flat", discussions: 3200, dotColor: "bg-violet-500" },
      { name: "Bug Bounty", trend: "up", discussions: 2100, dotColor: "bg-amber-500" },
      { name: "Ransomware", trend: "down", discussions: 1700, dotColor: "bg-rose-500" },
    ],
    discussion: {
      source: "r/netsec",
      sourceInitials: "r/",
      sourceColor: "bg-[#FF4500]",
      quote: "A critical zero-day is being actively exploited in the wild",
      likes: 15200,
      comments: 1100,
      url: "https://www.reddit.com/r/netsec/",
    },
  },
  cloud: {
    topics: [
      { name: "Docker", trend: "up", discussions: 6900, dotColor: "bg-orange-500" },
      { name: "Kubernetes", trend: "up", discussions: 5000, dotColor: "bg-emerald-500" },
      { name: "AWS", trend: "up", discussions: 3600, dotColor: "bg-blue-500" },
      { name: "Azure", trend: "flat", discussions: 2800, dotColor: "bg-violet-500" },
      { name: "Terraform", trend: "up", discussions: 2300, dotColor: "bg-amber-500" },
      { name: "Serverless", trend: "down", discussions: 1500, dotColor: "bg-rose-500" },
    ],
    discussion: {
      source: "Hacker News",
      sourceInitials: "HN",
      sourceColor: "bg-[#FF6600]",
      quote: "Kubernetes complexity is pushing teams back to boring servers",
      likes: 8100,
      comments: 634,
      url: "https://news.ycombinator.com/",
    },
  },
  "open-source": {
    topics: [
      { name: "React", trend: "up", discussions: 7100, dotColor: "bg-orange-500" },
      { name: "Next.js", trend: "up", discussions: 5600, dotColor: "bg-emerald-500" },
      { name: "Supabase", trend: "up", discussions: 4000, dotColor: "bg-blue-500" },
      { name: "Shadcn/ui", trend: "up", discussions: 3300, dotColor: "bg-violet-500" },
      { name: "Biome", trend: "flat", discussions: 1900, dotColor: "bg-amber-500" },
      { name: "Bun", trend: "down", discussions: 1400, dotColor: "bg-rose-500" },
    ],
    discussion: {
      source: "r/webdev",
      sourceInitials: "r/",
      sourceColor: "bg-[#FF4500]",
      quote: "Shadcn/ui basically became the default React component library",
      likes: 10300,
      comments: 701,
      url: "https://www.reddit.com/r/webdev/",
    },
  },
  general: {
    topics: [
      { name: "GPT-5.5 API", trend: "up", discussions: 9400, dotColor: "bg-orange-500" },
      { name: "Next.js 16", trend: "up", discussions: 6200, dotColor: "bg-emerald-500" },
      { name: "Claude Code", trend: "up", discussions: 5800, dotColor: "bg-blue-500" },
      { name: "Kubernetes", trend: "flat", discussions: 3400, dotColor: "bg-violet-500" },
      { name: "Rust", trend: "up", discussions: 2700, dotColor: "bg-amber-500" },
      { name: "Zero-Day", trend: "down", discussions: 2000, dotColor: "bg-rose-500" },
    ],
    discussion: {
      source: "Hacker News",
      sourceInitials: "HN",
      sourceColor: "bg-[#FF6600]",
      quote: "GPT-5.5's API pricing is reshaping how startups build AI products",
      likes: 14100,
      comments: 932,
      url: "https://news.ycombinator.com/",
    },
  },
};
