import { Header } from "@/components/layout/Header";
import { CompanyTicker } from "@/components/home/CompanyTicker";
import { HeroSection } from "@/components/home/HeroSection";
import { LatestNews } from "@/components/home/LatestNews";
import { MostRead } from "@/components/home/MostRead";
import { TrendingTopics } from "@/components/home/TrendingTopics";

export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-[1820px] gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.42fr)]">
          <div className="min-w-0 space-y-6">
            <HeroSection />
            <CompanyTicker />
            <LatestNews />
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
