import { getDeveloperHubStats } from "@/services/developer-hub/developer-hub-service";

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

/**
 * Developer Hub's top statistics bar (Developer Hub redesign, premium-
 * polish pass) - mirrors `NewsExplorerStatsStrip`'s exact shape and
 * styling so the page feels like the same product, but every figure
 * comes from `getDeveloperHubStats`, and none of them are plain
 * per-type inventory counts anymore ("10 Certifications, 7 Courses...")
 * - that read as a spec sheet, not a value statement. Instead: a live
 * "Updated {relative}" freshness pill, then Featured Resources
 * (`featuredCount` - real curated `featured: true` items plus GitHub
 * repos over the same 50k-star bar `buildCatalogPool` uses), Trending
 * Repositories (the live GitHub pool's real size), Developer Tools and
 * Roadmaps counts. Every number is still real - see
 * `getDeveloperHubStats`'s own doc comment - just chosen for what they
 * communicate about the catalog rather than an exhaustive tally.
 * Rendered at the top of the landing page and every dedicated sub-page,
 * same as the News Explorer's own strip appears on every Explorer route.
 */
export async function DeveloperHubStatsStrip() {
  const stats = await getDeveloperHubStats();

  const metrics = [
    { icon: "⭐", label: "Featured Resources", value: formatCount(stats.featuredCount) },
    { icon: "🐙", label: "Trending Repositories", value: formatCount(stats.githubReposCount) },
    { icon: "🧰", label: "Developer Tools", value: formatCount(stats.developerToolsCount) },
    { icon: "🗺️", label: "Roadmaps", value: formatCount(stats.roadmapsCount) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <span aria-hidden="true" className="size-2 rounded-full bg-emerald-500" />
        Updated {stats.lastUpdatedRelative}
      </div>
      <div aria-hidden="true" className="hidden h-5 w-px bg-slate-200 sm:block" />
      {metrics.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span aria-hidden="true" className="text-lg">
            {item.icon}
          </span>
          <span className="text-sm">
            <span className="font-bold text-slate-950">{item.value}</span>{" "}
            <span className="text-slate-500">{item.label}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
