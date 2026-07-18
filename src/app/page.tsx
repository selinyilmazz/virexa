import { Header } from "@/components/layout/Header";
import { BreakingNews } from "@/components/home/BreakingNews";
import { CompanyTicker } from "@/components/home/CompanyTicker";
import { HeroSection } from "@/components/home/HeroSection";
import { LatestNews } from "@/components/home/LatestNews";
import { TrendingTopics } from "@/components/home/TrendingTopics";

/**
 * Homepage (product polishing phase, 3rd pass, layout correction #2): a
 * classic 2-column news-site layout where each column flows completely
 * independently - "iki kolon birbirini beklememeli." Left column
 * (`xl:col-span-8`): Hero -> Breaking News -> Latest News, one
 * continuous vertical flow with no gap between them regardless of how
 * tall the sidebar ends up being. Right column (`xl:col-span-4`):
 * Trending Topics -> Trending Companies, `sticky` on `xl:` so it stays
 * in view as the user scrolls down the (usually much longer) left
 * column - the same pattern TechCrunch/most professional news sites use
 * for their trending/secondary sidebar. Below `xl:`, both columns just
 * stack in document order (Hero/Breaking/Latest first, sidebar last) -
 * `sticky` only applies once there's a real side-by-side layout to stick
 * within. Footer is global, rendered by the root layout. Editor's Picks
 * stays removed (Hero/Breaking News/Latest News already cover its job).
 */
export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="min-w-0 space-y-10 xl:col-span-8">
            <HeroSection />
            <BreakingNews />
            <LatestNews />
          </div>

          <aside className="min-w-0 xl:col-span-4">
            <div className="space-y-6 xl:sticky xl:top-8">
              <TrendingTopics />
              <CompanyTicker />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
