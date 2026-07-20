import type { ArticleContentBlock } from "@/data/article";
import type { StoredArticleRewrite } from "@/types/database";
import type { StructuredSummary } from "@/services/articles/article-read-service";
import { splitIntoParagraphs } from "@/lib/news";

type ArticleContentProps = {
  blocks: ArticleContentBlock[];
  /** Priority-3 fallback (product polishing phase, 3rd pass, item 5) - only reached when `rewrittenArticle` is also unavailable. */
  structuredSummary?: StructuredSummary | null;
  /** Priority-1 content (product polishing phase, 4th pass, items 6-7) - the full AI rewrite, rendered ahead of everything else when present. */
  rewrittenArticle?: StoredArticleRewrite | null;
  sourceLabel?: string;
  sourceUrl?: string;
};

/** Small-caps section label, shared by every headed subsection across both the rewrite view and the older structured-summary fallback. */
function SectionLabel({ children }: { children: string }) {
  return <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2f67e8]">{children}</h3>;
}

/** Delegates to the shared `splitIntoParagraphs` (see `lib/news/paragraph-split.ts`) so the AI rewrite view gets the same real-breaks -> single-newline -> sentence-grouped fallback chain as raw scraped content, instead of silently collapsing into one block on the rare AI output with no blank-line separators. */
function paragraphsOf(text: string): string[] {
  return splitIntoParagraphs(text);
}

/**
 * The full AI rewrite (product polishing phase, 4th pass, items 6-7) -
 * the article detail page's PRIMARY reading content. Renders every
 * section in the exact order item 6 specifies: short intro -> main
 * article text -> background -> why it matters -> technical details
 * (only when the rewrite actually produced one - `null` means the story
 * genuinely had no technical dimension, not a missing field) -> key
 * highlights -> conclusion. Long text is broken into headed subsections
 * throughout, never one giant unbroken block - "büyük, bölünmemiş metin
 * blokları olmamalı."
 */
function RewrittenArticleView({ article }: { article: StoredArticleRewrite }) {
  return (
    <div className="space-y-7">
      <p className="text-lg leading-relaxed text-slate-600">{article.intro}</p>

      <div className="space-y-4">
        {paragraphsOf(article.mainContent).map((paragraph, index) => (
          <p key={index} className="text-base leading-relaxed text-slate-700">
            {paragraph}
          </p>
        ))}
      </div>

      {article.background && (
        <div>
          <SectionLabel>Background</SectionLabel>
          <div className="mt-2 space-y-3">
            {paragraphsOf(article.background).map((paragraph, index) => (
              <p key={index} className="text-base leading-relaxed text-slate-700">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}

      {article.whyItMatters && (
        <div>
          <SectionLabel>Why It Matters</SectionLabel>
          <div className="mt-2 space-y-3">
            {paragraphsOf(article.whyItMatters).map((paragraph, index) => (
              <p key={index} className="text-base leading-relaxed text-slate-700">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}

      {article.technicalDetails && (
        <div>
          <SectionLabel>Technical Details</SectionLabel>
          <div className="mt-2 space-y-3">
            {paragraphsOf(article.technicalDetails).map((paragraph, index) => (
              <p key={index} className="text-base leading-relaxed text-slate-700">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}

      {article.keyHighlights.length > 0 && (
        <div>
          <SectionLabel>Key Highlights</SectionLabel>
          <ul className="mt-2 space-y-2">
            {article.keyHighlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-3 text-base leading-relaxed text-slate-700">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#2f67e8]" />
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {article.conclusion && (
        <div>
          <SectionLabel>Conclusion</SectionLabel>
          <p className="mt-2 text-base leading-relaxed text-slate-700">{article.conclusion}</p>
        </div>
      )}
    </div>
  );
}

function StructuredSummaryView({ summary }: { summary: StructuredSummary }) {
  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Overview</SectionLabel>
        <p className="mt-2 text-base leading-relaxed text-slate-700">{summary.overview}</p>
      </div>

      {summary.keyPoints.length > 0 && (
        <div>
          <SectionLabel>Key Points</SectionLabel>
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
          <SectionLabel>Technical Details</SectionLabel>
          <p className="mt-2 text-base leading-relaxed text-slate-700">{summary.technicalDetails}</p>
        </div>
      )}

      {summary.whyItMatters && (
        <div>
          <SectionLabel>Why It Matters</SectionLabel>
          <p className="mt-2 text-base leading-relaxed text-slate-700">{summary.whyItMatters}</p>
        </div>
      )}
    </div>
  );
}

function RawBlocksView({ blocks }: { blocks: ArticleContentBlock[] }) {
  return (
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
            <blockquote key={key} className="rounded-r-2xl border-l-4 border-[#2f67e8] bg-blue-50/60 py-4 pl-5 pr-4">
              <p className="text-lg italic leading-relaxed text-slate-700">{block.text}</p>
              {block.attribution && <footer className="mt-2 text-sm not-italic text-slate-500">— {block.attribution}</footer>}
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
  );
}

/**
 * Article detail page's main body (product polishing phase, 4th pass,
 * item 6 - "Virexa sadece bir RSS okuyucu gibi hissettirmemeli").
 * Content precedence, see `article-read-service.ts`'s `getArticleDetail`
 * doc comment for the full reasoning:
 *
 *   1. `rewrittenArticle` - the full AI rewrite, when available.
 *   2. `structuredSummary` - the older 4-section briefing fallback.
 *   3. `blocks` - real extracted content (or, as a last resort when
 *      neither AI capability is available, description + AI summary/
 *      TLDR blended by `buildContentBlocks`).
 *
 * Always ends with the "Continue Reading on {source}" CTA - the
 * original source stays visible for anyone who wants it, but is never
 * required to understand the story.
 */
export function ArticleContent({ blocks, structuredSummary, rewrittenArticle, sourceLabel, sourceUrl }: ArticleContentProps) {
  return (
    <div>
      {rewrittenArticle ? (
        <RewrittenArticleView article={rewrittenArticle} />
      ) : structuredSummary ? (
        <StructuredSummaryView summary={structuredSummary} />
      ) : (
        <RawBlocksView blocks={blocks} />
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
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
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
