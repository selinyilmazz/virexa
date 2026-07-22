import Image from "next/image";

type ArticleMetaProps = {
  sourceLogo: string;
  sourceName: string;
  publishedDate: string;
  readTime: string;
  /** Real `article_metrics.view_count` - `null`/`0` simply omits the view count rather than showing a fake or zero figure. */
  viewCount: number | null;
};

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

const eyeIcon = (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/**
 * The single Metadata Row (Article Detail redesign, structure item 6 -
 * "Only one metadata row"). Source logo + name, publication date,
 * reading time, and a real view count - nothing else. Replaces the old
 * `ArticleMeta`'s avatar+byline treatment (this app never had real
 * author bylines - the "author" prop was always just the source name
 * again) with the source's real logo, so the row reads as one coherent
 * publisher credit instead of a fake person.
 */
export function ArticleMeta({ sourceLogo, sourceName, publishedDate, readTime, viewCount }: ArticleMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5">
        <Image src={sourceLogo} alt="" width={20} height={20} unoptimized className="h-full w-full object-contain" />
      </span>
      <span className="font-semibold text-slate-950">{sourceName}</span>
      <span aria-hidden="true" className="text-slate-300">
        •
      </span>
      <span className="text-sm text-slate-500">{publishedDate}</span>
      <span aria-hidden="true" className="text-slate-300">
        •
      </span>
      <span className="text-sm text-slate-500">{readTime}</span>
      {viewCount !== null && viewCount > 0 && (
        <>
          <span aria-hidden="true" className="text-slate-300">
            •
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-slate-500">
            {eyeIcon}
            {formatViewCount(viewCount)} views
          </span>
        </>
      )}
    </div>
  );
}
