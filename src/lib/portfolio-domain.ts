import { env } from "@/lib/env";

/**
 * True when `host` (a raw `Host` header value, optionally with `:port`)
 * is Selin's personal portfolio domain (apex or `www.`) - see
 * `PORTFOLIO_DOMAIN` in `env.ts`. Shared between `middleware.ts` (does
 * the `/` -> `/portfolio` rewrite) and the root layout (needs to know,
 * server-side, whether to skip rendering Virexa's global `Footer` -
 * `usePathname()` in `ConditionalFooter.tsx` can't be trusted for this:
 * verified empirically that on a rewritten request it reports the
 * original browser-visible path (`/`), not the rewrite destination
 * (`/portfolio`), so a client-side pathname check alone would let
 * Virexa's footer render underneath the portfolio's own footer on the
 * personal domain). Returns `false` whenever `PORTFOLIO_DOMAIN` is
 * unset or `host` is null - a safe no-op default either way.
 */
export function isPortfolioHost(host: string | null): boolean {
  const domain = env.portfolio.domain;
  if (!domain || !host) return false;
  const hostname = host.toLowerCase().split(":")[0];
  return hostname === domain || hostname === `www.${domain}`;
}
