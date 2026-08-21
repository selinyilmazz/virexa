import { PortfolioFooter } from "@/components/portfolio/PortfolioFooter";
import { PortfolioNav } from "@/components/portfolio/PortfolioNav";
import { PortfolioThemeScope } from "@/components/portfolio/PortfolioThemeScope";
import "./portfolio.css";

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
    <PortfolioThemeScope>
      <PortfolioNav />
      {children}
      <PortfolioFooter />
    </PortfolioThemeScope>
  );
}
