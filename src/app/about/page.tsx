import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "About | Virexa",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <LegalPageLayout
        title="About Virexa"
        description="AI-powered news, curated for people who don't have time to read everything."
      >
        <section>
          <h2 className="text-xl font-bold text-slate-950">Our Mission</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            Virexa exists to cut through information overload. Every day, thousands of stories are published across
            technology, business, AI, games and world news — far more than anyone can realistically read. We use
            AI-generated summaries and smart categorization to help readers get to the point faster, without losing
            the context that matters.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">What We Do</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            We aggregate reporting from a wide range of sources and organize it into clear categories, trending
            topics and personalized reading lists. Readers can bookmark articles to revisit later, follow the topics
            they care about, and adjust how much detail they want from each summary — all from one place.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">How We Work</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            Virexa is built as a lightweight, fast reading experience first. We favor clarity over clutter, keep the
            interface consistent across every page, and design every feature — from bookmarks to search filters — to
            respect the reader&apos;s time and attention.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Get in Touch</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            Have feedback, a partnership idea, or a correction to report? Reach us any time at{" "}
            <a href="mailto:hello@virexa.app" className="font-medium text-[#2f67e8] hover:text-[#2556c9]">
              hello@virexa.app
            </a>
            .
          </p>
        </section>
      </LegalPageLayout>
    </>
  );
}
