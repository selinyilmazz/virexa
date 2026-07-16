import { mostReadItems } from "@/data/most-read";

export function MostRead() {
  return (
    <section
      aria-labelledby="most-read-title"
      className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="px-1">
        <h2 id="most-read-title" className="font-serif text-3xl font-bold tracking-tight text-slate-950">
          📈 Most Read
        </h2>
        <p className="mt-1 text-base text-slate-500">Most viewed articles today</p>
      </div>

      <ol className="mt-4 space-y-4">
        {mostReadItems.map((item) => (
          <li key={item.rank} className="flex items-start gap-3">
            <span className="w-5 shrink-0 text-base font-bold text-slate-950">{item.rank}</span>
            <div className="min-w-0">
              <p className="text-base font-semibold leading-snug text-slate-950">{item.title}</p>
              <p className="mt-0.5 text-sm text-slate-500">{item.views}</p>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="mt-6 w-full rounded-2xl border-2 border-[#2f67e8] px-6 py-3 text-base font-semibold text-[#2f67e8] transition-colors hover:bg-blue-50"
      >
        View all most read articles →
      </button>
    </section>
  );
}
