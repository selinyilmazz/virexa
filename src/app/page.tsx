import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { LatestNews } from "@/components/home/LatestNews";
import { LatestReleases } from "@/components/home/LatestReleases";
import { MostRead } from "@/components/home/MostRead";

/**
 * Homepage redesign (recreating a provided reference layout, improving
 * spacing/consistency rather than changing its structure): two
 * independent 65/35 rows, not one tall masonry column, so the left and
 * right column of EACH row size only against its own row's content:
 *
 *  1. Featured Story (`xl:col-span-8`) + Most Read Today (`xl:col-span-4`)
 *  2. Latest News (`xl:col-span-8`) + Latest Releases (`xl:col-span-4`)
 *
 * Breaking News / Trending Companies / Trending Topics / Resources &
 * Career Hub are intentionally no longer rendered here (UI cleanup pass:
 * the home page focuses on articles, releases, and trending content -
 * "Resources & Career Hub" only ever surfaced a single item and added
 * clutter without real value) - their component files are untouched in
 * case they're reused elsewhere. Below `xl` every section just stacks in
 * document order; Footer is global (root layout).
 */
export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 pb-8 pt-10 sm:px-8">
        <div className="mx-auto max-w-[1820px] space-y-8">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
            <div className="min-w-0 xl:col-span-8">
              <HeroSection />
            </div>
            <aside className="min-w-0 xl:col-span-4">
              <MostRead />
            </aside>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
            <div className="min-w-0 xl:col-span-8">
              <LatestNews />
            </div>
            <aside className="min-w-0 xl:col-span-4">
              <LatestReleases />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
