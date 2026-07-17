import type { MetadataRoute } from "next";

/**
 * Web App Manifest (Production Readiness phase, SEO Audit). Reuses the
 * existing `src/app/icon.svg` (already auto-served by Next.js's file
 * convention as the favicon/app icon) as the single manifest icon -
 * no new image assets were generated for this, matching "yeni asset
 * üretme" caution; an SVG `any`-purpose icon is valid per the Web App
 * Manifest spec and covers every installable-PWA icon slot.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Virexa",
    short_name: "Virexa",
    description: "Virexa is a modern AI news aggregation platform covering technology, business, AI, games and world news.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2f67e8",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
