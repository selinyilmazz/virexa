import type { ArticleContentBlock } from "@/data/article";
import type { StructuredSummary } from "@/services/articles/article-read-service";

type ArticleContentProps = {
  blocks: ArticleContentBlock[];
  /** Priority-2 fallback (product polishing phase, 3rd pass, item 5) - when present, rendered instead of `blocks` as four labeled sections. */
  structuredSummary?: StructuredSummary | null;
  sourceLabel?: string;
  sourceUrl?: string;
};

function StructuredSummaryView({ summary }: { summary: StructuredSummary }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2f67e8]">Overview</h3>
        <p className="mt-2 text-base leading-relaxed text-slate-700">{summary.overview}</p>
      </div>

      {summary.keyPoints.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2f67e8]">Key Points</h3>
          <ul className="mt-2 space-y-2">
            {summary.keyPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-base leading-relaxed text-slate-700">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#2f67e8]" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.technicalDetails && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2f67e8]">Technical Details</h3>
          <p className="mt-2 text-base leading-relaxed text-slate-700">{summary.technicalDetails}</p>
        </div>
      )}

      {summary.whyItMatters && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2f67e8]">Why It Matters</h3>
          <p className="mt-2 text-base leading-relaxed text-slate-700">{summary.whyItMatters}</p>
        </div>
      )}
    </div>
  );
}

export function ArticleContent({ blocks, structuredSummary, sourceLabel, sourceUrl }: ArticleContentProps) {
  return (
    <div>
      {structuredSummary ? (
        <StructuredSummaryView summary={structuredSummary} />
      ) : (
        <div className="space-y-5">
          {blocks.map((block, index) => {
            const key = `${block.type}-${index}`;

            if (block.type === "heading") {
              return (
                <h2 key={key} className="pt-2 text-2xl font-bold tracking-tight text-slate-950">
                  {block.text}
                </h2>
              );
            }

            if (block.type === "quote") {
              return (
                <blockquote
                  key={key}
                  className="rounded-r-2xl border-l-4 border-[#2f67e8] bg-blue-50/60 py-4 pl-5 pr-4"
                >
                  <p className="text-lg italic leading-relaxed text-slate-700">{block.text}</p>
                  {block.attribution && (
                    <footer className="mt-2 text-sm not-italic text-slate-500">— {block.attribution}</footer>
                  )}
                </blockquote>
              );
            }

            if (block.type === "list") {
              return (
                <ul key={key} className="space-y-2">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-slate-700">
                      <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#2f67e8]" />
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }

            return (
              <p key={key} className="text-base leading-relaxed text-slate-700">
                {block.text}
              </p>
            );
          })}
        </div>
      )}

      {sourceLabel && sourceUrl && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-500">
            Read what&apos;s here, then head to the original whenever you&apos;re ready - never required.
          </p>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2f67e8] transition-colors hover:text-[#2556c9]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
              <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
            </svg>
            Continue Reading on {sourceLabel}
          </a>
        </div>
      )}
    </div>
  );
}
