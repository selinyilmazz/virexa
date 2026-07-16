import Image from "next/image";

type ArticleMetaProps = {
  authorName: string;
  authorAvatar: string;
  publishedDate: string;
  readTime: string;
};

export function ArticleMeta({ authorName, authorAvatar, publishedDate, readTime }: ArticleMetaProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black">
        <Image src={authorAvatar} alt={`${authorName} avatar`} width={24} height={24} />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-slate-950">{authorName}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
          <span>{publishedDate}</span>
          <span aria-hidden="true">•</span>
          <span>{readTime}</span>
        </p>
      </div>
    </div>
  );
}
