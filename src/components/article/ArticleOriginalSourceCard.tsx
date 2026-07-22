import Image from "next/image";

type ArticleOriginalSourceCardProps = {
  sourceLogo: string;
  sourceName: string;
  sourceWebsite: string | undefined;
  sourceUrl: string;
};

const externalIcon = (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

/** Real hostname from a source's registered website (e.g. `"reuters.com"`) - an honest, factual one-line descriptor rather than an invented marketing blurb per source (the source registry has no `description` field, and this app never fabricates one). */
function hostnameOf(website: string | undefined): string | null {
  if (!website) return null;
  try {
    return new URL(website).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Original Source card (structure item 10) - the ONLY external CTA on
 * the page. Compact, sits at the end of the article body. Replaces the
 * old inline "Continue Reading on {source}" text link at the bottom of
 * `ArticleContent` with a real card, and is the single place this page
 * ever mentions the source again after the metadata row (no duplicated
 * source info elsewhere, per the redesign's "no duplicated source card"
 * rule).
 */
export function ArticleOriginalSourceCard({ sourceLogo, sourceName, sourceWebsite, sourceUrl }: ArticleOriginalSourceCardProps) {
  const hostname = hostnameOf(sourceWebsite);

  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
          <Image src={sourceLogo} alt="" width={24} height={24} unoptimized className="h-full w-full object-contain" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-slate-950">{sourceName}</p>
          {hostname && <p className="text-sm text-slate-500">{hostname}</p>}
        </div>
      </div>

      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
      >
        Read Original Article
        {externalIcon}
      </a>
    </div>
  );
}
