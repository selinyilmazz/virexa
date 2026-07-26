/**
 * Bot/crawler detection by `User-Agent` (Vercel performance audit -
 * "Prevent bots (Googlebot, Bingbot, GPTBot, ClaudeBot, etc.) from
 * incrementing article view counts"). Used only to gate metrics WRITES
 * (`incrementArticleView` - see `/article/[slug]/page.tsx`), never to
 * gate rendering or content - a crawler still gets the exact same page
 * every real visitor does, it just doesn't get counted as a "view".
 *
 * Deliberately a plain substring match against a maintained list rather
 * than a heuristic/ML classifier: false negatives (an unlisted bot still
 * bumping the counter) are harmless - same as today - while false
 * positives (a real reader's view silently not counting) would corrupt
 * `article_metrics.view_count`, a number this app surfaces directly to
 * users ("N views" on the article meta row and the homepage's Most Read
 * widget). A short, explicit, easy-to-extend list is the safer default.
 *
 * Covers: major search engine crawlers (Google, Bing, Yahoo/Slurp,
 * DuckDuckGo, Baidu, Yandex, Naver), social-share link-preview bots
 * (Facebook, Twitter/X, LinkedIn, Slack, Discord, Telegram, WhatsApp),
 * AI/LLM crawlers and answer-engine fetchers (GPTBot, ChatGPT-User,
 * OAI-SearchBot, ClaudeBot, Claude-Web, Anthropic-AI, PerplexityBot,
 * Google-Extended, Bytespider, Amazonbot, Applebot, Applebot-Extended,
 * meta-externalagent, cohere-ai, DuckAssistBot), and common SEO/uptime/
 * generic crawler tooling (Ahrefs, Semrush, MJ12bot/Majestic, DotBot,
 * PetalBot, UptimeRobot, Pingdom, and any UA that self-identifies via
 * the generic "bot"/"crawler"/"spider"/"slurp" tokens most well-behaved
 * automated clients include by convention).
 */
const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|slurp|crawling|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|linkedinbot|pinterest|embedly|quora link preview|outbrain|vkshare|w3c_validator|redditbot|skypeuripreview|nuzzel|flipboard|tumblr|bitlybot|chatgpt-user|oai-searchbot|gptbot|claude-web|claudebot|anthropic-ai|perplexitybot|duckassistbot|cohere-ai|ccbot|google-extended|bytespider|amazonbot|applebot|meta-externalagent|headlesschrome|phantomjs|puppeteer|playwright|lighthouse|pagespeed|uptimerobot|pingdom|datadog|newrelic|ahrefsbot|semrushbot|mj12bot|dotbot|petalbot|screaming frog|python-requests|curl\/|wget\/|axios\/|node-fetch|go-http-client|java\/|libwww-perl/i;

/** `true` for a recognized crawler/automated-client `User-Agent`, `false` for a missing/unrecognized one (fails open toward "counts as a real view", same as every other soft-config gate in this app). */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return BOT_USER_AGENT_PATTERN.test(userAgent);
}

/**
 * Narrower subset of `isBotUserAgent` above - only the third-party SEO/
 * backlink-analysis crawlers (Ahrefs, Semrush, Majestic, Moz) that
 * scrape broadly across a whole site purely for their own paid tooling,
 * with zero referral traffic or indexing benefit to Virexa in return.
 *
 * Deliberately excludes everything else `isBotUserAgent` recognizes -
 * real search engines (Googlebot, Bingbot, Slurp, DuckDuckBot, Baidu,
 * Yandex, Naver, PetalBot) and AI/LLM crawlers (GPTBot, ClaudeBot,
 * PerplexityBot, ...) both drive real traffic/visibility and must never
 * be throttled or disallowed by anything built against this function -
 * see `robots.ts`'s doc comment for the same scoping rule applied there.
 *
 * (Traffic-spike defensive measures - "safe middleware throttling for
 * non-search-engine SEO crawlers") Used by `middleware.ts` to rate-limit
 * this specific traffic before it reaches the page-render Vercel
 * Function - the runtime backstop for the bots that don't honor
 * `robots.txt`'s (advisory-only) disallow rule for the same UAs.
 */
const SEO_CRAWLER_USER_AGENT_PATTERN = /ahrefsbot|semrushbot|mj12bot|dotbot/i;

/** `true` only for the narrow SEO-crawler set above - `false` for everything else, including every other bot category `isBotUserAgent` recognizes. */
export function isSeoCrawlerUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return SEO_CRAWLER_USER_AGENT_PATTERN.test(userAgent);
}
