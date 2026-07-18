import Link from "next/link";

type CategoryCardProps = {
  slug: string;
  icon: string;
  name: string;
  tags: string[];
  articleCount: number;
};

/**
 * Explore Categories tile (product polishing phase, 2nd pass: cards
 * were "gereğinden büyük" - a 14-size icon, an xl heading, and a
 * 2-line description each card, mostly repeating the category name in
 * sentence form). Replaced the long description with a short topic-tag
 * line ("AI • Cloud • Programming" - the same `popularTags` data the
 * taxonomy already carries, just the first few labels) and tightened
 * spacing/icon size so the grid reads as a fast-scan directory instead
 * of a stack of mini feature cards.
 */
export function CategoryCard({ slug, icon, name, tags, articleCount }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${slug}`}
      className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
          {icon}
        </span>
        <h2 className="min-w-0 truncate text-base font-bold tracking-tight text-slate-950">{name}</h2>
      </div>
      {tags.length > 0 && <p className="truncate text-xs font-medium text-slate-400">{tags.join(" • ")}</p>}
      <p className="text-xs font-semibold text-[#2f67e8]">{articleCount} articles</p>
    </Link>
  );
}
