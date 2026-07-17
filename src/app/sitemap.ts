import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getSitemapEntries } from "@/services/articles/article-read-service";
import { categories } from "@/data/categories";

/**
 * `sitemap.xml` (Production Readiness phase, SEO Audit). Lists the
 * static public routes plus every category page and a bounded, most-
 * recent slice of article pages (see `getSitemapEntries` in
 * `article-read-service.ts` for the cap and why). `/admin/*`, auth
 * pages (`/signin`, `/signup`, `/forgot-password`), and user-specific
 * pages (`/bookmarks`, `/profile`, `/settings`) are intentionally
 * excluded - not meant to be indexed. Read-only, never throws:
 * `getSitemapEntries` already returns `[]` on failure, same convention
 * as every other read in that service.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.site.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/most-read`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  const articleEntries = await getSitemapEntries();
  const articleRoutes: MetadataRoute.Sitemap = articleEntries.map((entry) => ({
    url: `${baseUrl}/article/${entry.slug}`,
    lastModified: new Date(entry.updatedAt),
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}
