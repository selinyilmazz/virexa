import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * `robots.txt` (Production Readiness phase, SEO Audit). Disallows only
 * `/admin` (private, already auth-gated by middleware.ts - not meant to
 * be indexed anyway) and `/api` (server endpoints, not pages). Every
 * other route is public and crawlable, matching the "no new pages, no
 * behavior change" scope of this phase - this file only describes
 * existing routes to crawlers, it doesn't add any.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/"],
    },
    sitemap: `${env.site.url}/sitemap.xml`,
  };
}
