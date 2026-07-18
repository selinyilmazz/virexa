import { Header } from "@/components/layout/Header";
import { BreakingNews } from "@/components/home/BreakingNews";
import { CompanyTicker } from "@/components/home/CompanyTicker";
import { HeroSection } from "@/components/home/HeroSection";
import { LatestNews } from "@/components/home/LatestNews";
import { TrendingTopics } from "@/components/home/TrendingTopics";

/**
 * Homepage (product polishing phase, 3rd pass - "bu çalışma yeniden
 * tasarım değildir", explicitly reverting the 2nd pass's single-column
 * experiment back to a 2-column layout with a right sidebar, which is
 * the original/preferred structure). Left column: Hero, Breaking News,
 * Latest News (Footer is global, rendered by the root layout). Right
 * sidebar: Trending Topics, Trending Companies - both moved out of the
 * main flow and now render as compact vertical lists rather than
 * standalone full-width sections. Editor's Picks was removed outright
 * (Hero/Breaking News/Latest News already cover its job - see the
 * deleted `EditorsPicks.tsx` and `getEditorsPicks`).
 */
export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <HeroSection />
        <div className="mx-auto mt-10 grid max-w-[1280px] gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.34fr)]">
          <div className="min-w-0 space-y-10">
            <BreakingNews />
            <LatestNews />
          </div>
          <aside className="min-w-0 space-y-6">
            <TrendingTopics />
            <CompanyTicker />
          </aside>
        </div>
      </main>
    </>
  );
}
