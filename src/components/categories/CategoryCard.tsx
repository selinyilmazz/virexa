import Link from "next/link";

type CategoryCardProps = {
  slug: string;
  icon: string;
  name: string;
  description: string;
  articleCount: number;
};

export function CategoryCard({ slug, icon, name, description, articleCount }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${slug}`}
      className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
        {icon}
      </span>
      <h2 className="text-xl font-bold tracking-tight text-slate-950">{name}</h2>
      <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">{description}</p>
      <p className="mt-auto pt-2 text-sm font-semibold text-[#2f67e8]">{articleCount} articles</p>
    </Link>
  );
}
