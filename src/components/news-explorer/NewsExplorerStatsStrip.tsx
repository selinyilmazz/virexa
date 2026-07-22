import { getNewsExplorerStats } from "@/services/articles/article-read-service";

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

/**
 * News Explorer stats strip (Phase F, Turkish follow-up suggestion -
 * "Bu küçük detay sayfaya canlılık katar ve kullanıcıya Virexa'nın
 * sürekli güncellenen, yaşayan bir platform olduğu hissini verir").
 * Every figure is a real, current database count (see
 * `getNewsExplorerStats`'s doc comment for exactly how each one is
 * derived) - never a placeholder number.
 */
export async function NewsExplorerStatsStrip() {
  const stats = await getNewsExplorerStats();

  const items = [
    { icon: "📰", label: "Articles", value: formatCount(stats.articlesCount) },
    { icon: "🚀", label: "Releases", value: formatCount(stats.releasesCount) },
    { icon: "📚", label: "Resources", value: formatCount(stats.resourcesCount) },
    { icon: "🏢", label: "Sources", value: formatCount(stats.sourcesCount) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
      {items.map((item) => (
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
      <div className="flex items-center gap-2 text-sm text-slate-500 sm:ml-auto">
        <span aria-hidden="true">🕒</span>
        Last updated: {stats.lastUpdatedRelative}
      </div>
    </div>
  );
}
