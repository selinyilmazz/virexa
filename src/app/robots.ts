import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * `robots.txt` (Production Readiness phase, SEO Audit). Disallows only
 * `/admin` (private, already auth-gated by middleware.ts - not meant to
 * be indexed anyway) and `/api` (server endpoints, not pages). Every
 * other route is public and crawlable for the default `*` rule - real
 * search engines (Googlebot, Bingbot, ...) and AI/LLM crawlers (GPTBot,
 * ClaudeBot, PerplexityBot, ...) are untouched, since both drive real
 * traffic/visibility this site wants.
 *
 * (Traffic-spike defensive measures, lowest-risk tier - see
 * PERFORMANCE_AUDIT.md) The second rule below disallows the whole site
 * for the handful of third-party SEO/backlink-analysis crawlers that
 * scrape broadly purely for their own paid tooling (Ahrefs, Semrush,
 * Majestic, Moz) - none of them send referral traffic or index anything
 * on Virexa's behalf, so there's no upside to being crawled by them, only
 * load. This list intentionally mirrors `isSeoCrawlerUserAgent()` in
 * `src/lib/bots/is-bot-request.ts`, which backs the runtime rate-limit in
 * `middleware.ts` - `robots.txt` is the free, zero-risk, advisory layer
 * (a compliant bot honors it outright); the middleware throttle is the
 * backstop for the ones that don't.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
      {
        userAgent: ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot"],
        disallow: "/",
      },
    ],
    sitemap: `${env.site.url}/sitemap.xml`,
  };
}
