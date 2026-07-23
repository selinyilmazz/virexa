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
    // Recategorized Technology -> Programming (product polishing phase,
    // area 2): a developer-tooling/open-source blog is a much more
    // accurate fit for Programming than the generic Technology bucket,
    // and it also gives the previously-empty Programming category its
    // first real source at zero new-feed cost.
    sourceId: "github-blog",
    category: "Programming",
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

  // ==========================================================================
  // Product polishing phase, area 2 ("CATEGORY COVERAGE"): Technology and AI
  // had many/some articles; Business, Games, World, Science, Security,
  // Startup, Programming, Mobile, Robotics, and Space had almost none -
  // every enabled feed above only ever labels its own items "Technology" or
  // "AI". The feeds below give every one of those categories a real,
  // dedicated source. Same house rule as above: only feeds on a domain/URL
  // pattern already confirmed working elsewhere in this registry (BBC,
  // TechCrunch) or an extremely long-standing, widely-documented endpoint
  // are enabled outright; anything less certain is added `enabled: false`
  // with a `disabledReason` for manual verification, never guessed live.
  // ==========================================================================
  {
    id: "bbc-world",
    label: "BBC World News",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    sourceId: "bbc",
    category: "World",
    enabled: true,
  },
  {
    id: "bbc-science-environment",
    label: "BBC Science & Environment",
    url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    sourceId: "bbc",
    category: "Science",
    enabled: true,
  },
  {
    id: "aljazeera-all",
    label: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    sourceId: "al-jazeera",
    category: "World",
    enabled: true,
  },
  {
    id: "techcrunch-startups",
    label: "TechCrunch Startups",
    url: "https://techcrunch.com/category/startups/feed/",
    sourceId: "techcrunch",
    category: "Startup",
    enabled: true,
  },
  {
    id: "forbes-business",
    label: "Forbes Business",
    url: "https://www.forbes.com/business/feed/",
    sourceId: "forbes",
    category: "Business",
    enabled: true,
  },
  {
    id: "fortune",
    label: "Fortune",
    url: "https://fortune.com/feed/",
    sourceId: "forbes",
    category: "Business",
    enabled: false,
    disabledReason: "Candidate second Business source - Fortune's CMS/feed path could not be confirmed without outbound network access in this environment. Verify manually, then flip enabled to true (and register a dedicated 'fortune' source id instead of reusing 'forbes').",
  },
  {
    id: "ign-all",
    label: "IGN",
    url: "https://feeds.ign.com/ign/all",
    sourceId: "ign",
    category: "Games",
    enabled: true,
  },
  {
    id: "polygon",
    label: "Polygon",
    url: "https://www.polygon.com/rss/index.xml",
    sourceId: "polygon",
    category: "Games",
    enabled: true,
  },
  {
    id: "pcgamer",
    label: "PC Gamer",
    url: "https://www.pcgamer.com/rss/",
    sourceId: "ign",
    category: "Games",
    enabled: false,
    disabledReason: "Candidate third Games source - Future plc's exact feed path for this title could not be confirmed without outbound network access. Verify manually, then flip enabled to true (and register a dedicated 'pc-gamer' source id instead of reusing 'ign').",
  },

  // ==========================================================================
  // Mobile Games ecosystem expansion: "Mobile Games" was redefined to cover
  // the mobile game DEVELOPMENT ecosystem (engines, LiveOps, monetization,
  // ASO, UA, analytics, studios, major publishers - see category-mapper.ts),
  // not just consumer mobile-gaming news. IGN/Polygon above are general
  // console/PC outlets and essentially never use this category's dev/
  // industry-jargon aliases in a headline, which is why Mobile Games had
  // zero articles even after a full backfill (confirmed via code + feed
  // audit, not guessed).
  //
  // Every URL below was LIVE-VERIFIED (fetched and inspected for a real
  // RSS/Atom content-type and actual, current entries) before being set to
  // `enabled: true` - this is not a guess-and-hope list. Two of the three
  // originally-proposed sources needed a swap after verification:
  //   - PocketGamer.biz: no working public RSS endpoint found after
  //     trying /rss, /rss/, /feed, /feed/, /rss.xml, /feed.xml, /news/rss,
  //     /news/index.rss - the site (confirmed live and on-topic via its
  //     homepage) simply doesn't expose one anymore. Not replaced with a
  //     separate row since `deconstructor-of-fun` and `touch-arcade` below
  //     already cover this exact "mobile games industry" niche live.
  //   - Deconstructor of Fun's URL was corrected from a guessed
  //     `/blog-feed.xml` to the real Squarespace feed path, confirmed
  //     returning `application/rss+xml` with live entries.
  // ==========================================================================
  {
    id: "deconstructor-of-fun",
    label: "Deconstructor of Fun",
    url: "https://www.deconstructoroffun.com/blog?format=rss",
    sourceId: "deconstructor-of-fun",
    category: "Mobile Games",
    enabled: true,
  },
  {
    id: "touch-arcade",
    label: "TouchArcade",
    url: "https://toucharcade.com/feed/",
    sourceId: "touch-arcade",
    category: "Mobile Games",
    enabled: true,
  },

  // --- Technical/developer resources ("teknik kaynaklardan da beslensin" -
  // should also draw from technical sources, not just news): engines,
  // platform docs blogs and official dev-relations channels, not
  // journalism. All six confirmed live before enabling; two requested
  // sources (Unity Blog, GDC) had no working public feed and were
  // substituted per the same "replace rather than leave disabled" rule
  // applied to PocketGamer.biz above - see each entry's comment.
  {
    id: "unity-discussions",
    label: "Unity Discussions (Forum)",
    // Substitute for "Unity Blog": blog.unity.com now redirects to
    // unity.com/blog, a JS-rendered page with no discoverable RSS link
    // (confirmed by fetching it directly - no <link rel="alternate"> feed
    // reference, and /rss and /feed both 404). Unity's own community
    // forum (Discourse-based) exposes a real, live `/latest.rss` instead -
    // still genuinely Unity-run, just forum discussion rather than
    // official blog posts.
    url: "https://discussions.unity.com/latest.rss",
    sourceId: "unity-discussions",
    category: "Mobile Games",
    enabled: true,
  },
  {
    id: "unreal-engine-news",
    label: "Unreal Engine News & Blog",
    url: "https://www.unrealengine.com/rss",
    sourceId: "unreal-engine",
    category: "Mobile Games",
    enabled: true,
  },
  {
    id: "android-developers-blog",
    label: "Android Developers Blog",
    url: "https://android-developers.googleblog.com/atom.xml",
    sourceId: "android-developers",
    category: "Mobile Games",
    enabled: true,
  },
  {
    id: "google-play-developers",
    label: "Google Play (Android Developers Blog)",
    // Google doesn't run a separate "Google Play Developers" blog - Play
    // Store/Play Console posts are a labeled subset of the same Android
    // Developers Blog above. This is that label's own Blogger feed
    // (confirmed live, real Atom content), which also covers what the
    // request called "Play Console" - same publisher, same underlying
    // blog, no separate feed exists for that either.
    url: "https://android-developers.googleblog.com/feeds/posts/default/-/Google%20Play",
    sourceId: "android-developers",
    category: "Mobile Games",
    enabled: true,
  },
  {
    id: "firebase-blog",
    label: "Firebase Blog",
    // Covers Firebase overall (not gaming-exclusive) - Firebase has no
    // separate "Firebase Gaming"-only feed, but Firebase's game-relevant
    // announcements (Firebase for Games, Play Games Services, Crashlytics
    // for game clients, etc.) are published here.
    url: "https://firebase.blog/rss.xml",
    sourceId: "firebase",
    category: "Mobile Games",
    enabled: true,
  },
  {
    id: "apple-developer-news",
    label: "Apple Developer News",
    // Same caveat as Firebase above - general Apple Developer News, not a
    // gaming-only channel (Apple doesn't run one), but covers App
    // Store/GameKit/gaming-relevant platform announcements when they
    // happen.
    url: "https://developer.apple.com/news/rss/news.rss",
    sourceId: "apple-developer",
    category: "Mobile Games",
    enabled: true,
  },
  {
    id: "game-developer-gamasutra",
    label: "Game Developer (Gamasutra)",
    // Also serves as the practical substitute for "GDC": gdconf.com's own
    // News & Insights page is a JS-rendered SPA with no discoverable feed
    // (confirmed by fetching it directly - /feed and /news/rss both
    // empty). Game Developer is the games industry's main trade
    // publication and extensively covers GDC talks, award winners and
    // State of the Industry reports, so it's the closer real substitute
    // rather than forcing in an unverified GDC URL.
    url: "https://www.gamedeveloper.com/rss.xml",
    sourceId: "game-developer",
    category: "Mobile Games",
    enabled: true,
  },
  {
    id: "krebs-on-security",
    label: "Krebs on Security",
    url: "https://krebsonsecurity.com/feed/",
    sourceId: "krebs-on-security",
    category: "Security",
    enabled: true,
  },
  {
    id: "the-hacker-news",
    label: "The Hacker News",
    url: "https://feeds.feedburner.com/TheHackersNews",
    sourceId: "the-hacker-news",
    category: "Security",
    enabled: true,
  },
  {
    id: "science-daily-all",
    label: "ScienceDaily",
    url: "https://www.sciencedaily.com/rss/all.xml",
    sourceId: "science-daily",
    category: "Science",
    enabled: true,
  },
  {
    id: "stackoverflow-blog",
    label: "Stack Overflow Blog",
    url: "https://stackoverflow.blog/feed/",
    sourceId: "stack-overflow-blog",
    category: "Programming",
    enabled: true,
  },
  {
    id: "android-authority",
    label: "Android Authority",
    url: "https://www.androidauthority.com/feed/",
    sourceId: "android-authority",
    category: "Mobile",
    enabled: true,
  },
  {
    id: "the-robot-report",
    label: "The Robot Report",
    url: "https://www.therobotreport.com/feed/",
    sourceId: "the-robot-report",
    category: "Robotics",
    enabled: true,
  },
  {
    id: "ieee-spectrum-robotics",
    label: "IEEE Spectrum - Robotics",
    url: "https://spectrum.ieee.org/feeds/topic/robotics.rss",
    sourceId: "the-robot-report",
    category: "Robotics",
    enabled: false,
    disabledReason: "Candidate second Robotics source - IEEE Spectrum's exact topic-feed path could not be confirmed without outbound network access. Verify manually, then flip enabled to true (and register a dedicated 'ieee-spectrum' source id instead of reusing 'the-robot-report').",
  },
  {
    id: "nasa-breaking-news",
    label: "NASA Breaking News",
    url: "https://www.nasa.gov/rss/dyn/breaking_news.rss",
    sourceId: "nasa",
    category: "Space",
    enabled: true,
  },
  {
    id: "space-com",
    label: "Space.com",
    url: "https://www.space.com/feeds/all",
    sourceId: "nasa",
    category: "Space",
    enabled: false,
    disabledReason: "Candidate second Space source - Future plc's exact feed path for this title could not be confirmed without outbound network access. Verify manually, then flip enabled to true (and register a dedicated 'space-com' source id instead of reusing 'nasa').",
  },
];
