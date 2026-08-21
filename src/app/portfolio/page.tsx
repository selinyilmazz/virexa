import type { Metadata } from "next";
import { personalInfo } from "@/data/portfolio";
import { HeroSection } from "@/components/portfolio/HeroSection";
import { SkillsSection } from "@/components/portfolio/SkillsSection";
import { ProjectsSection } from "@/components/portfolio/ProjectsSection";
import { EducationSection } from "@/components/portfolio/EducationSection";
import { CertificationsSection } from "@/components/portfolio/CertificationsSection";
import { AboutSection } from "@/components/portfolio/AboutSection";
import { ContactSection } from "@/components/portfolio/ContactSection";

export const metadata: Metadata = {
  title: `${personalInfo.name} — ${personalInfo.title}`,
  description: personalInfo.tagline,
  openGraph: {
    title: `${personalInfo.name} — ${personalInfo.title}`,
    description: personalInfo.tagline,
    type: "profile",
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
 * Faz 3 complete: Hero + Skills + Projects + Education +
 * Certifications + About + Contact. Experience is intentionally
 * skipped - the CV has no Work/Internship Experience section (see
 * `src/data/portfolio.ts`'s doc comment).
 */
export default function PortfolioPage() {
  return (
    <main>
      <HeroSection />
      <SkillsSection />
      <ProjectsSection />
      <EducationSection />
      <CertificationsSection />
      <AboutSection />
      <ContactSection />
    </main>
  );
}
