import type { NextConfig } from "next";

/**
 * Security headers applied to every response (Production Readiness
 * phase, requirement 3). Conservative, framework-agnostic defaults -
 * none of these change existing behavior for a same-origin app like
 * Virexa, they only remove capabilities the app never uses (framing,
 * legacy MIME sniffing, geolocation/camera/microphone, etc.).
 *
 * No Content-Security-Policy header is set here: Next.js's own
 * hydration/runtime scripts and its dev-mode tooling need
 * `unsafe-inline`/`unsafe-eval` allowances that differ between `next dev`
 * and a production build, and a correct policy needs to be authored
 * against the real deployed script/style fingerprints (or a nonce
 * wired through `middleware.ts`) and tested end to end - not guessed
 * here. Flagged as a known gap in the final report rather than
 * shipping a CSP that silently breaks the site.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Applies to every route, including API routes - a plain
        // security baseline, not a per-route policy.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
