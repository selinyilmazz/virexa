import { Header } from "@/components/layout/Header";
import { BreakingNews } from "@/components/home/BreakingNews";
import { CompanyTicker } from "@/components/home/CompanyTicker";
import { HeroSection } from "@/components/home/HeroSection";
import { LatestNews } from "@/components/home/LatestNews";
import { MostRead } from "@/components/home/MostRead";
import { TrendingTopics } from "@/components/home/TrendingTopics";

/**
 * Homepage (product polishing phase, 4th pass, layout correction #4) -
 * a genuine, independent two-column editorial layout, matching
 * TechCrunch/The Verge/Ars Technica/Bloomberg Technology's visual
 * rhythm instead of a centered, landing-page-like stack:
 *
 * - ONE 12-column grid for the whole page (not several stacked grid
 *   blocks tied row-by-row - that previous structure was what caused
 *   Latest News to bleed under the sidebar and Breaking News to only
 *   coincidentally line up with Hero's width). Each column is a SINGLE
 *   grid item spanning the full height, so the two columns size
 *   independently of each other - neither can push, stretch, or
 *   truncate the other.
 * - Left column (`xl:col-span-8`): Hero -> Breaking News -> Latest
 *   News, stacked top-to-bottom with `space-y-10`, all sharing the
 *   exact same width.
 * - Right column (`xl:col-span-4`): Trending Topics + Trending
 *   Companies (one unified bordered card - "sağ sütun tek bir bütün
 *   gibi görünmeli") then Most Read, stacked with `space-y-6`.
 * - `max-w-[1820px]` matches every other page's content container
 *   (search/category/article/bookmarks/most-read all already use this
 *   width) - the homepage was the one outlier still capped at 1280px,
 *   which is what made Hero read as pushed toward the center instead
 *   of starting flush under the header's logo.
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
        <div className="mx-auto grid max-w-[1820px] grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="min-w-0 space-y-10 xl:col-span-8">
            <HeroSection />
            <BreakingNews />
            <LatestNews />
          </div>

          <aside className="min-w-0 space-y-6 xl:col-span-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <TrendingTopics />
              <div className="my-5 border-t border-slate-200" />
              <CompanyTicker />
            </div>
            <MostRead />
          </aside>
        </div>
      </main>
    </>
  );
}
