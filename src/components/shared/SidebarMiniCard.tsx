import type { ImageProps } from "next/image";
import Link from "next/link";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";

type SidebarMiniCardProps = {
  slug: string;
  image: ImageProps["src"];
  category: string;
  title: string;
  source: string;
  publishedDate: string;
};

/**
 * Dedicated Sidebar Mini Card (product polishing phase, areas 3 and 6):
 * a compact, fully-clickable row with a small thumbnail - the "premium
 * sidebar feed" treatment for any list of articles inside a sidebar
 * widget (currently the category page's "Recently Added", which used to
 * be a plain numbered `<li>` of non-linked text). The whole row is the
 * link (`after:absolute after:inset-0` on the title, same pattern every
 * other card variant uses), not just the title text.
 */
export function SidebarMiniCard({ slug, image, category, title, source, publishedDate }: SidebarMiniCardProps) {
  return (
    <Link
      href={`/article/${slug}`}
      className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50"
    >
      <span className="relative block size-14 shrink-0 overflow-hidden rounded-lg">
        <NewsImage
          src={image}
          fallbackSrc={resolveFallbackImageForCategory(category)}
          alt={title}
          fill
          sizes="56px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block text-sm font-semibold leading-snug text-slate-950 group-hover:text-[#2f67e8]">
          {title}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <span className="truncate">{source}</span>
          <span aria-hidden="true" className="shrink-0 text-slate-300">
            •
          </span>
          <span className="shrink-0">{publishedDate}</span>
        </span>
      </span>
    </Link>
  );
}
