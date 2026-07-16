import type { CategoryTag } from "@/data/categories";

type PopularTagsProps = {
  tags: CategoryTag[];
};

export function PopularTags({ tags }: PopularTagsProps) {
  return (
    <section
      aria-labelledby="popular-tags-title"
      className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 id="popular-tags-title" className="font-serif text-3xl font-bold tracking-tight text-slate-950">
        🏷️ Popular Tags
      </h2>
      <p className="mt-1 text-base text-slate-500">Explore trending topics</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag.label}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700">
              {tag.label}
              <span className="text-slate-400">{tag.count}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
