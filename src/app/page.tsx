import { Header } from "@/components/layout/Header";
import { AIExplained } from "@/components/home/AIExplained";
import { BreakingNews } from "@/components/home/BreakingNews";
import { CompanyTicker } from "@/components/home/CompanyTicker";
import { EditorsPicks } from "@/components/home/EditorsPicks";
import { HeroSection } from "@/components/home/HeroSection";
import { LatestNews } from "@/components/home/LatestNews";
import { MostRead } from "@/components/home/MostRead";
import { RecentlyAdded } from "@/components/home/RecentlyAdded";
import { TrendingTopics } from "@/components/home/TrendingTopics";

/**
 * Homepage - premium redesign (Apple News / Arc Search / Perplexity
 * Discover / Linear / Stripe visual language: dominant hero photography,
 * strong typographic hierarchy, real article images throughout, an
 * interactive Trending Topics widget). Section order, main column:
 * dominant Hero -> Breaking News strip -> Trending Companies -> Latest
 * News -> Editor's Picks -> AI Explained -> Recently Added. Sidebar:
 * Trending Topics -> Most Read. Every new section (`BreakingNews`,
 * `EditorsPicks`, `AIExplained`, `RecentlyAdded`) renders `null` when it
 * has nothing to show, so a young/sparse dataset never leaves an empty
 * section shell on the page.
 */
export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-[1820px] gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.42fr)]">
          <div className="min-w-0">
            <HeroSection />
            <BreakingNews />
            <CompanyTicker />
            <LatestNews />
            <EditorsPicks />
            <AIExplained />
            <RecentlyAdded />
          </div>
          <aside className="min-w-0 space-y-6">
            <TrendingTopics />
            <MostRead />
          </aside>
        </div>
      </main>
    </>
  );
}
