import Image from "next/image";

type ArticleHeroProps = {
  image: string;
  category: string;
  title: string;
  summary: string;
};

export function ArticleHero({ image, category, title, summary }: ArticleHeroProps) {
  return (
    <div>
      <div className="relative aspect-[12/5] w-full overflow-hidden rounded-3xl">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 1180px"
          className="object-cover"
          priority
        />
      </div>

      <span className="mt-6 inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-[#2f67e8]">
        {category}
      </span>

      <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>

      <p className="mt-4 text-lg leading-relaxed text-slate-500">{summary}</p>
    </div>
  );
}
