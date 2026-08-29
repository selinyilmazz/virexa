import { Playfair_Display } from "next/font/google";
import { PortfolioFooter } from "@/components/portfolio/PortfolioFooter";
import { PortfolioNav } from "@/components/portfolio/PortfolioNav";
import { PortfolioThemeScope } from "@/components/portfolio/PortfolioThemeScope";
import "./portfolio.css";

/**
 * Editorial display serif, loaded here and ONLY here via
 * `next/font/google` - scoped to the `/portfolio` route through the
 * `--font-portfolio-serif` CSS variable set on this subtree's wrapper
 * `<div>`, never touching `src/app/layout.tsx`'s fonts
 * (`--font-sans`/`--font-mono`) or any other route. Used for the large
 * display headings (`.portfolio-serif` in `portfolio.css`); body copy
 * still uses the inherited `--font-sans` (Inter).
 */
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-portfolio-serif",
  display: "swap",
});

/**
 * Isolated shell for the `/portfolio` route - its own theme scope, nav
 * and footer, none of them shared with the rest of the site (see
 * `PortfolioThemeScope.tsx` for why theming is independent). The root
 * layout (`src/app/layout.tsx`) still wraps this - i18n/auth/global
 * theme providers stay mounted, they just have no visible effect here
 * since nothing in this subtree reads from them. Root `Header` isn't
 * rendered by the root layout for any route (every page opts in
 * individually), so simply not importing it here is enough to keep the
 * news-site navigation off this page.
 */
export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={playfairDisplay.variable}>
      <PortfolioThemeScope>
        <PortfolioNav />
        {children}
        <PortfolioFooter />
      </PortfolioThemeScope>
    </div>
  );
}
