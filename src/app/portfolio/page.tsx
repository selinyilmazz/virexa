import type { Metadata } from "next";
import { personalInfo } from "@/data/portfolio";
import { env } from "@/lib/env";
import { HeroSection } from "@/components/portfolio/HeroSection";
import { ProjectsSection } from "@/components/portfolio/ProjectsSection";
import { AboutSection } from "@/components/portfolio/AboutSection";
import { SkillsSection } from "@/components/portfolio/SkillsSection";
import { ExperienceSection } from "@/components/portfolio/ExperienceSection";
import { EducationSection } from "@/components/portfolio/EducationSection";
import { CertificationsSection } from "@/components/portfolio/CertificationsSection";
import { ContactSection } from "@/components/portfolio/ContactSection";
import { PortfolioWaveDivider } from "@/components/portfolio/PortfolioWaveDivider";

// The portfolio's one true canonical identity - regardless of whether
// it was reached via the personal-domain rewrite (see middleware.ts)
// or directly at `<NEXT_PUBLIC_SITE_URL>/portfolio`, both should point
// search engines/social previews at the same URL to avoid duplicate-
// content SEO issues. `undefined` when PORTFOLIO_DOMAIN isn't
// configured - falls back to the implicit `.../portfolio` URL, exactly
// as before this feature.
const portfolioUrl = env.portfolio.domain ? `https://${env.portfolio.domain}` : undefined;

export const metadata: Metadata = {
  title: `${personalInfo.name} — ${personalInfo.title}`,
  description: personalInfo.tagline,
  ...(portfolioUrl ? { alternates: { canonical: portfolioUrl } } : {}),
  openGraph: {
    title: `${personalInfo.name} — ${personalInfo.title}`,
    description: personalInfo.tagline,
    type: "profile",
    ...(portfolioUrl ? { url: portfolioUrl } : {}),
  },
  // Metadata merges shallowly per top-level key with the root layout's,
  // so without this the root's "Virexa" twitter card would show here
  // even though openGraph above is already overridden.
  twitter: {
    card: "summary_large_image",
    title: `${personalInfo.name} — ${personalInfo.title}`,
    description: personalInfo.tagline,
  },
  // Same shallow-merge-per-key behavior as `twitter` above: without
  // this, Next.js still injects the root `favicon.ico` `<link>`
  // alongside `icon.tsx`'s generated one, since `favicon.ico` can only
  // be set at the app root (Next.js file-convention docs) and isn't
  // suppressed by a nested segment's own `icon` file. Declaring `icons`
  // explicitly here replaces the inherited set for this route instead
  // of appending to it, so the tab only ever offers the SY icon.
  icons: {
    icon: "/portfolio/icon",
  },
};

/**
 * Editorial redesign pass (Ağustos 2026): section order per spec - Hero,
 * Selected Projects, About, Technical Skills, Experience, Education,
 * Certifications, Contact. `ExperienceSection` is new (previously
 * skipped entirely since `experience` is empty) - it now renders an
 * honest "not yet" state instead of being omitted; see that
 * component's doc comment.
 *
 * Wave-transition pass: About and Education are wrapped in a
 * `.portfolio-band-light` cream "insert page", entered/exited through
 * `PortfolioWaveDivider` - the alternating-band-with-wave-boundary
 * style the user asked for, reusing this page's own existing palette
 * (no new colors, no content changes to either section). See
 * `PortfolioWaveDivider.tsx` and `portfolio.css`'s `.portfolio-band-
 * light` rule for how the color hand-off works.
 */
export default function PortfolioPage() {
  return (
    <main>
      <HeroSection />
      <ProjectsSection />

      <PortfolioWaveDivider fill="var(--portfolio-band-bg)" />
      <div className="portfolio-band-light">
        <AboutSection />
      </div>
      <PortfolioWaveDivider fill="var(--portfolio-bg)" flip />

      <SkillsSection />
      <ExperienceSection />

      <PortfolioWaveDivider fill="var(--portfolio-band-bg)" />
      <div className="portfolio-band-light">
        <EducationSection />
      </div>
      <PortfolioWaveDivider fill="var(--portfolio-bg)" flip />

      <CertificationsSection />
      <ContactSection />
    </main>
  );
}
