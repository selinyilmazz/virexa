import Link from "next/link";
import { Header } from "@/components/layout/Header";
import {
  BadgeCheckIcon,
  BookOpenIcon,
  CloudIcon,
  CompassIcon,
  FileTextIcon,
  GithubMarkIcon,
  GridIcon,
  RocketIcon,
  RouteIcon,
  SparkleIcon,
  WrenchIcon,
} from "@/components/developer-hub/CategoryIcons";
import { LANGUAGE_DOT_COLORS, formatStat } from "@/components/developer-hub/CatalogCard";
import { ContinueLearningSection } from "@/components/developer-hub/ContinueLearningSection";
import { DeveloperHubStatsStrip } from "@/components/developer-hub/DeveloperHubStatsStrip";
import { FeaturedResourcesCarousel } from "@/components/developer-hub/FeaturedResourcesCarousel";
import {
  AwsIcon,
  DockerIcon,
  KubernetesIcon,
  NodeIcon,
  ReactIcon,
  VSCodeIcon,
  resolveBrandVisual,
} from "@/components/developer-hub/brand-icons";
import { getCatalogItems, getDeveloperHubStats, getFeaturedCatalogItems } from "@/services/developer-hub/developer-hub-service";

function CheckIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

/**
 * Hero illustration's floating tech badges - real brand marks (see
 * `brand-icons.tsx`) plus two generic concept icons (AI/Cloud,
 * `CategoryIcons.tsx`), positioned on an evenly-spaced ring (`top`/`left`
 * percentages, each centered via `-translate-x-1/2 -translate-y-1/2`)
 * around the laptop instead of clustered corners, so nothing crowds its
 * neighbor. Four "front" badges (GitHub/VS Code/AWS/Docker - larger,
 * `z-20`, full opacity) and five "back" badges (Node/React/Kubernetes/
 * AI/Cloud - smaller, lower `z-index`, slightly reduced opacity) give the
 * layered depth feel. Purely decorative.
 */
const HERO_BADGES = [
  { Icon: GithubMarkIcon, top: 36.3, left: 8.6, className: "z-20 size-12 bg-white text-slate-900 ring-1 ring-slate-100" },
  { Icon: VSCodeIcon, top: 50, left: 94, className: "z-20 size-11 bg-white ring-1 ring-slate-100" },
  { Icon: AwsIcon, top: 63.7, left: 8.6, className: "z-20 size-12 bg-[#232F3E] text-[#FF9900]" },
  { Icon: DockerIcon, top: 75.7, left: 83.7, className: "z-20 size-11 bg-[#2496ED] text-white" },
  { Icon: NodeIcon, top: 84.6, left: 28, className: "z-10 size-9 bg-[#333333] text-[#68A063] opacity-95" },
  { Icon: ReactIcon, top: 89.4, left: 57.6, className: "z-10 size-9 bg-[#20232A] text-[#61DAFB] opacity-95" },
  { Icon: KubernetesIcon, top: 15.4, left: 28, className: "z-0 size-9 bg-[#326CE5] text-white opacity-90" },
  { Icon: SparkleIcon, top: 10.6, left: 57.6, className: "z-0 size-9 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white opacity-90" },
  { Icon: CloudIcon, top: 24.3, left: 83.7, className: "z-0 size-9 bg-sky-50 text-sky-600 opacity-90" },
];

/** Minimalist "dashboard" chips shown on the Hero laptop screen - purely decorative, not a real live preview. */
const HERO_SCREEN_CHIPS = ["React", "Docker", "AWS", "TypeScript"];

/** Trust-signal pills shown under the Hero's CTAs. */
const HERO_TRUST_PILLS = ["Updated Daily", "Curated Resources", "Free & Premium Content"];

export const metadata = {
  title: "Developer Hub | VIREXA",
  description: "Certifications, courses, learning paths, GitHub repositories, developer tools and roadmaps - all in one place.",
};

const RESOURCE_NAV_ITEMS = [
  { label: "All Resources", href: "/developer-hub", Icon: GridIcon },
  { label: "Certifications", href: "/developer-hub/certifications", Icon: BadgeCheckIcon },
  { label: "Courses", href: "/developer-hub/courses", Icon: BookOpenIcon },
  { label: "Learning Paths", href: "/developer-hub/learning-paths", Icon: RouteIcon },
  { label: "GitHub Explorer", href: "/developer-hub/github", Icon: GithubMarkIcon },
  { label: "Developer Tools", href: "/developer-hub/tools", Icon: WrenchIcon },
  { label: "Roadmaps", href: "/developer-hub/roadmaps", Icon: CompassIcon },
  { label: "Releases", href: "/developer-hub/releases", Icon: RocketIcon },
  { label: "Cheat Sheets", href: "/developer-hub/cheat-sheets", Icon: FileTextIcon },
];

/**
 * Developer Hub landing page (Developer Hub redesign, renamed from
 * "Resources") - an overview/dashboard, not a filterable list. Per the
 * chosen hybrid architecture: this page previews every resource type
 * with real counts and "View all"-style links; each resource type also
 * has its own dedicated page rendering the shared `CatalogExplorerView`
 * template (`/developer-hub/certifications`, `/courses`, etc.) - see
 * that component's doc comment. Releases route to the unified News
 * Explorer instead (`ExplorerView`, `defaultContentType: "release"`),
 * since those are real DB articles already served well by that page.
 */
export default async function DeveloperHubPage() {
  const [stats, featured, githubPreview] = await Promise.all([
    getDeveloperHubStats(),
    getFeaturedCatalogItems(10),
    getCatalogItems({ resourceTypes: ["github-repo"], sort: "featured", pageSize: 5 }),
  ]);

  // Card-quality pass: professional line-art icons (matching `CategoryNav`'s
  // existing stroke-icon convention) instead of emoji - see `CategoryIcons.tsx`.
  // Premium-polish pass: each category's icon now sits in its own
  // gradient/glass tile with a soft color-matched glow behind it, instead
  // of tinting the whole card background - closer to how Linear/Vercel
  // give a card's "identity color" to one small element rather than the
  // full surface.
  const popularCategories = [
    {
      Icon: BadgeCheckIcon,
      title: "Certifications",
      description: "Industry-recognized certifications",
      count: stats.certificationsCount,
      href: "/developer-hub/certifications",
      gradient: "from-emerald-400 to-emerald-600",
      glow: "bg-emerald-400/40",
      topProviders: ["AWS", "Microsoft", "Google", "Cisco"],
    },
    {
      Icon: BookOpenIcon,
      title: "Courses",
      description: "Online courses from top providers",
      count: stats.coursesCount,
      href: "/developer-hub/courses",
      gradient: "from-indigo-400 to-indigo-600",
      glow: "bg-indigo-400/40",
      topProviders: ["Coursera", "Udemy", "freeCodeCamp"],
    },
    {
      Icon: RouteIcon,
      title: "Learning Paths",
      description: "Structured, official learning paths",
      count: stats.learningPathsCount,
      href: "/developer-hub/learning-paths",
      gradient: "from-violet-400 to-violet-600",
      glow: "bg-violet-400/40",
      topProviders: ["Microsoft Learn", "roadmap.sh"],
    },
    {
      Icon: GithubMarkIcon,
      title: "GitHub Explorer",
      description: "Live open source repository data",
      count: stats.githubReposCount,
      href: "/developer-hub/github",
      gradient: "from-slate-700 to-slate-900",
      glow: "bg-slate-400/40",
      topProviders: ["GitHub", "Trending", "Open Source"],
      // Premium-polish pass: this card gets a bit more presence than its
      // siblings (bigger icon tile, an extra row of live-data tags) since
      // it's the one category backed by real-time data rather than a
      // static curated list - worth calling out.
      highlight: true,
      extraTags: ["Trending", "Open Source", "Popular", "TypeScript"],
    },
    {
      Icon: WrenchIcon,
      title: "Developer Tools",
      description: "Popular, free developer tools",
      count: stats.developerToolsCount,
      href: "/developer-hub/tools",
      gradient: "from-amber-400 to-amber-600",
      glow: "bg-amber-400/40",
      topProviders: ["VS Code", "Docker", "Postman"],
    },
    {
      Icon: CompassIcon,
      title: "Roadmaps",
      description: "Step-by-step developer guides",
      count: stats.roadmapsCount,
      href: "/developer-hub/roadmaps",
      gradient: "from-rose-400 to-rose-600",
      glow: "bg-rose-400/40",
      topProviders: ["Frontend", "Backend", "DevOps"],
    },
  ];

  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <DeveloperHubStatsStrip />

          <nav aria-label="Breadcrumb" className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="transition-colors duration-200 hover:text-slate-700">
              Home
            </Link>
            <span aria-hidden="true">›</span>
            <span className="font-medium text-slate-950">Developer Hub</span>
          </nav>

          <div className="relative mt-6 grid gap-8 overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur-xl sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:p-14">
            {/* Premium, non-flat Hero background - very soft blue/violet ambient glow, purely decorative. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-24 -top-32 size-96 rounded-full bg-[radial-gradient(circle,rgba(47,103,232,0.10),transparent_70%)] blur-3xl" />
              <div className="absolute -right-16 bottom-0 size-80 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.10),transparent_70%)] blur-3xl" />
            </div>

            <div className="relative">
              <h1 className="font-serif text-4xl font-bold leading-[1.15] tracking-tight text-slate-950 sm:text-5xl">Developer Hub</h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-500">
                Learn, build and grow with curated developer resources, certifications, GitHub repositories, learning paths and tools.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#popular-categories"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2f67e8] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2556c9] hover:shadow-lg hover:shadow-blue-500/25"
                >
                  Explore Resources
                  <span aria-hidden="true">→</span>
                </a>
                <Link
                  href="/developer-hub/learning-paths"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2f67e8] hover:text-[#2f67e8] hover:shadow-sm"
                >
                  <RouteIcon className="size-4" />
                  Start Learning
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {HERO_TRUST_PILLS.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                  >
                    <CheckIcon className="size-3 text-emerald-600" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Developer-themed illustration: GitHub/VS Code/AWS/Docker/Node.js/React/Kubernetes/AI/Cloud on a well-spaced ring around a laptop with 3D-feeling depth and a minimal dashboard-style screen - premium, purely visual/decorative. */}
            <div className="relative hidden h-72 items-center justify-center lg:flex">
              <div className="relative flex h-64 w-96 items-center justify-center" aria-hidden="true">
                {/* Laptop */}
                <div className="relative z-10 flex -rotate-2 flex-col items-center drop-shadow-2xl">
                  <div className="flex h-28 w-44 flex-col overflow-hidden rounded-lg border-[3px] border-slate-800 bg-slate-900 p-2 shadow-xl">
                    <div className="flex size-full flex-col rounded-sm bg-gradient-to-br from-[#2f67e8]/60 via-violet-500/40 to-fuchsia-500/15 p-2">
                      <p className="text-[7px] font-bold uppercase tracking-wide text-white/95">Developer Hub</p>
                      <p className="text-[6px] font-medium text-white/60">Today&apos;s Picks</p>
                      <div className="mt-1.5 grid grid-cols-2 gap-1">
                        {HERO_SCREEN_CHIPS.map((chip) => (
                          <span key={chip} className="truncate rounded bg-white/15 px-1 py-0.5 text-center text-[6px] font-semibold text-white/85">
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="h-2.5 w-52 rounded-b-md bg-gradient-to-b from-slate-700 to-slate-800 shadow-md" />
                  <div className="h-1 w-56 rounded-full bg-slate-950/10 blur-sm" />
                </div>

                {/* Floating tech badges - evenly-spaced ring, layered depth via z-index/size/opacity, gentle hover scale. */}
                {HERO_BADGES.map(({ Icon, top, left, className }, index) => (
                  <span
                    key={index}
                    style={{ top: `${top}%`, left: `${left}%` }}
                    className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl shadow-lg backdrop-blur-sm transition-transform duration-200 hover:z-30 hover:scale-110 ${className}`}
                  >
                    <Icon className="size-[55%]" />
                  </span>
                ))}
              </div>
            </div>
          </div>

          <nav aria-label="Resource type" className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {RESOURCE_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.href === "/developer-hub" ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                  item.href === "/developer-hub" ? "bg-[#2f67e8] text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <item.Icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <ContinueLearningSection />

          <section id="popular-categories" className="mt-10 scroll-mt-24">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">Popular Categories</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popularCategories.map((category) => {
                const iconTileSize = category.highlight ? "size-14" : "size-12";
                return (
                  <Link
                    key={category.href}
                    href={category.href}
                    className={`group flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[#2f67e8] hover:shadow-lg ${
                      category.highlight ? "border-slate-300 shadow-md" : "border-slate-200"
                    }`}
                  >
                    <div className={`relative flex items-center justify-center ${iconTileSize}`}>
                      <span aria-hidden="true" className={`absolute inset-0 -m-1.5 rounded-full ${category.glow} blur-lg`} />
                      <span
                        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br shadow-md ring-1 ring-white/50 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110 ${iconTileSize} ${category.gradient}`}
                      >
                        <category.Icon className={category.highlight ? "size-7 text-white" : "size-6 text-white"} />
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold tracking-tight text-slate-950">{category.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{category.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {category.topProviders.map((provider) => (
                        <span
                          key={provider}
                          className="rounded-full border border-slate-200/70 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                        >
                          {provider}
                        </span>
                      ))}
                    </div>

                    {category.extraTags && (
                      <div className="flex flex-wrap gap-1.5">
                        {category.extraTags.map((tag) => (
                          <span key={tag} className="rounded-full bg-[#2f67e8]/10 px-2 py-0.5 text-[11px] font-semibold text-[#2f67e8]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-base font-bold text-slate-950">{category.count.toLocaleString("en-US")} resources</span>
                      <span aria-hidden="true" className="text-slate-500 transition-transform duration-200 group-hover:translate-x-1.5">
                        →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {githubPreview.items.length > 0 && (
            <section id="trending-github" className="mt-10 scroll-mt-24">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Trending GitHub Repositories</h2>
                <Link
                  href="/developer-hub/github"
                  className="text-sm font-medium text-[#2f67e8] transition-colors duration-200 hover:text-[#2556c9]"
                >
                  View all repositories
                </Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {githubPreview.items.map((item) => {
                  const visual = resolveBrandVisual(item.brandKey);
                  return (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={`flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg ${visual.bg} ${visual.fg}`}
                        >
                          <span className="scale-[0.65]">{visual.content}</span>
                        </span>
                        <span className="truncate text-sm font-bold text-slate-950">
                          <span className="text-slate-400">{item.owner}/</span>
                          {item.repoName}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{item.description}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        {item.tag && (
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                            <span
                              aria-hidden="true"
                              className="size-2 rounded-full"
                              style={{ backgroundColor: LANGUAGE_DOT_COLORS[item.tag] ?? "#9CA3AF" }}
                            />
                            {item.tag}
                          </span>
                        )}
                        {item.license && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">{item.license}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>⭐ {formatStat(item.stars)}</span>
                        <span>⑂ {formatStat(item.forks)}</span>
                        <span className="ml-auto">Updated {item.updatedRelative}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {featured.length > 0 && (
            <section id="editors-picks" className="mt-10 scroll-mt-24">
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Editor&apos;s Picks</h2>
              <div className="mt-4">
                <FeaturedResourcesCarousel items={featured} />
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
