import { Header } from "@/components/layout/Header";
import { BreakingNews } from "@/components/home/BreakingNews";
import { CompanyTicker } from "@/components/home/CompanyTicker";
import { HeroSection } from "@/components/home/HeroSection";
import { LatestNews } from "@/components/home/LatestNews";
import { TrendingTopics } from "@/components/home/TrendingTopics";

/**
 * Homepage (product polishing phase, 3rd pass, layout correction): a
 * classic news-site layout with the sidebar sitting beside the Hero, not
 * below it - "Hero'nun sağ tarafında tek bir sidebar olmalı." Row 1 is a
 * grid: Hero (left) + a right sidebar (Trending Topics, then Trending
 * Companies directly under it, both compact vertical lists). Breaking
 * News and Latest News are full-width sections underneath, spanning the
 * whole content width - NOT part of that first row's grid. Footer is
 * global, rendered by the root layout. Editor's Picks stays removed
 * (Hero/Breaking News/Latest News already cover its job).
 */
export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-[1280px] gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.34fr)]">
          <HeroSection />
          <aside className="min-w-0 space-y-6">
            <TrendingTopics />
            <CompanyTicker />
          </aside>
        </div>

        <div className="mx-auto mt-10 max-w-[1280px] space-y-10">
          <BreakingNews />
          <LatestNews />
        </div>
      </main>
    </>
  );
}
