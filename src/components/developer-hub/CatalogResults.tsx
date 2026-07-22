import { CatalogCard } from "@/components/developer-hub/CatalogCard";
import type { CatalogItem } from "@/services/developer-hub/developer-hub-service";

type CatalogResultsProps = { items: CatalogItem[] };

/** Developer Hub's catalog list - mirrors `NewsExplorerResults`'s plain server-rendered rows + empty state. */
export function CatalogResults({ items }: CatalogResultsProps) {
  if (items.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center">
        <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
          🔍
        </span>
        <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-950">No resources match these filters</h3>
        <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">Try widening your filters or clearing the search.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {items.map((item) => (
        <CatalogCard key={item.id} item={item} />
      ))}
    </div>
  );
}
