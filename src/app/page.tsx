import { Header } from "@/components/layout/Header";
import { BreakingNews } from "@/components/home/BreakingNews";
import { CompanyTicker } from "@/components/home/CompanyTicker";
import { HeroSection } from "@/components/home/HeroSection";
import { LatestNews } from "@/components/home/LatestNews";
import { MostRead } from "@/components/home/MostRead";
import { TrendingTopics } from "@/components/home/TrendingTopics";

/**
 * Homepage (product polishing phase, 3rd pass, layout correction #3) -
 * a classic, balanced news-site hierarchy in three paired sections
 * rather than one long scrolling column, matching TechCrunch/The Verge/
 * Ars Technica/Bloomberg Technology's visual rhythm:
 *
 * 1. Hero (`xl:col-span-8`) beside a single unified sidebar card
 *    (`xl:col-span-4`) containing Trending Topics + Trending Companies
 *    stacked with one divider between them - "sağ sütun tek bir bütün
 *    gibi görünmeli", so this is ONE bordered card, not two.
 * 2. Breaking News (`xl:col-span-8`) beside Most Read (`xl:col-span-4`).
 * 3. Latest News, full width.
 *
 * Below `xl`, every section just stacks in document order. Footer is
 * global (root layout). Editor's Picks stays removed (Hero/Breaking
 * News/Latest News already cover its job).
 */
export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-8">
            <HeroSection />
          </div>
          <aside className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
            <TrendingTopics />
            <div className="my-5 border-t border-slate-200" />
            <CompanyTicker />
          </aside>
        </div>

        <div className="mx-auto mt-8 grid max-w-[1280px] grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-8">
            <BreakingNews />
          </div>
          <aside className="min-w-0 xl:col-span-4">
            <MostRead />
          </aside>
        </div>

        <div className="mx-auto mt-8 max-w-[1280px]">
          <LatestNews />
        </div>
      </main>
    </>
  );
}
