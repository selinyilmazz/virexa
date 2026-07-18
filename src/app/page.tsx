import { Header } from "@/components/layout/Header";
import { BreakingNews } from "@/components/home/BreakingNews";
import { CompanyTicker } from "@/components/home/CompanyTicker";
import { EditorsPicks } from "@/components/home/EditorsPicks";
import { HeroSection } from "@/components/home/HeroSection";
import { LatestNews } from "@/components/home/LatestNews";
import { TrendingTopics } from "@/components/home/TrendingTopics";

/**
 * Homepage - simplified to a single vertical flow (product polishing
 * phase, 2nd pass: "sadeleştir" - the previous version had a sidebar
 * plus two extra sections that duplicated other sections' jobs).
 * Section order: Hero -> Trending Topics -> Breaking News -> Trending
 * Companies -> Latest News -> Editor's Picks -> Footer (Footer is
 * global, rendered by the root layout). AI Explained (duplicated the
 * article page's own AI Insights) and Recently Added (duplicated Latest
 * News) were removed outright, along with the sidebar's Most Read
 * widget (still available on its own dedicated `/most-read` page).
 * Every section that can be empty still renders `null` when it has
 * nothing to show, so a young/sparse dataset never leaves an empty
 * section shell on the page.
 */
export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <HeroSection />
        <TrendingTopics />
        <BreakingNews />
        <CompanyTicker />
        <LatestNews />
        <EditorsPicks />
      </main>
    </>
  );
}
