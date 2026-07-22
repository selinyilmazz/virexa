import type { ArticleContentBlock } from "@/data/article";
import type { StoredArticleRewrite } from "@/types/database";
import type { StructuredSummary } from "@/services/articles/article-read-service";
import { splitIntoParagraphs } from "@/lib/news";
import { ArticleCodeBlock } from "@/components/article/ArticleCodeBlock";

type ArticleContentProps = {
  blocks: ArticleContentBlock[];
  /** Priority-3 fallback - only reached when `rewrittenArticle` is also unavailable. */
  structuredSummary?: StructuredSummary | null;
  /** Priority-1 content - the full AI rewrite, rendered ahead of everything else when present. */
  rewrittenArticle?: StoredArticleRewrite | null;
};

/** Shared subsection heading - unified across all three content paths (rewrite, structured summary, raw blocks) instead of the old mix of small-caps labels and `<h2>`s, per the redesign's "clean typography" requirement. */
function SectionHeading({ children }: { children: string }) {
  return <h2 className="pt-2 text-2xl font-bold tracking-tight text-slate-950">{children}</h2>;
}

/** Delegates to the shared `splitIntoParagraphs` so the AI rewrite view gets the same real-breaks -> single-newline -> sentence-grouped fallback chain as raw scraped content. */
function paragraphsOf(text: string): string[] {
  return splitIntoParagraphs(text);
}

function ParagraphGroup({ text }: { text: string }) {
  return (
    <div className="space-y-4">
      {paragraphsOf(text).map((paragraph, index) => (
        <p key={index} className="text-base leading-[1.9] text-slate-700">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-base leading-[1.9] text-slate-700">
          <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#2f67e8]" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * The full AI rewrite - the article detail page's PRIMARY reading
 * content. `intro` is deliberately NOT rendered here since it's already
 * shown as the page's deck (see `ArticleHeaderBlock`) - repeating it here
 * would duplicate the exact same sentence the reader just read above the
 * hero. Order: main article text -> background -> why it matters ->
 * technical details (only when the rewrite actually produced one) -> key
 * highlights -> conclusion.
 */
function RewrittenArticleView({ article }: { article: StoredArticleRewrite }) {
  return (
    <div className="space-y-8">
      <ParagraphGroup text={article.mainContent} />

      {article.background && (
        <div className="space-y-3">
          <SectionHeading>Background</SectionHeading>
          <ParagraphGroup text={article.background} />
        </div>
      )}

      {article.whyItMatters && (
        <div className="space-y-3">
          <SectionHeading>Why It Matters</SectionHeading>
          <ParagraphGroup text={article.whyItMatters} />
        </div>
      )}

      {article.technicalDetails && (
        <div className="space-y-3">
          <SectionHeading>Technical Details</SectionHeading>
          <ParagraphGroup text={article.technicalDetails} />
        </div>
      )}

      {article.keyHighlights.length > 0 && (
        <div className="space-y-3">
          <SectionHeading>Key Highlights</SectionHeading>
          <BulletList items={article.keyHighlights} />
        </div>
      )}

      {article.conclusion && (
        <div className="space-y-3">
          <SectionHeading>Conclusion</SectionHeading>
          <p className="text-base leading-[1.9] text-slate-700">{article.conclusion}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Older 4-section briefing fallback, used only when there's no full AI
 * rewrite. `overview` is skipped for the same reason `intro` is skipped
 * above - it's already shown as the page's deck.
 */
function StructuredSummaryView({ summary }: { summary: StructuredSummary }) {
  return (
    <div className="space-y-8">
      {summary.keyPoints.length > 0 && (
        <div className="space-y-3">
          <SectionHeading>Key Points</SectionHeading>
          <BulletList items={summary.keyPoints} />
        </div>
      )}

      {summary.technicalDetails && (
        <div className="space-y-3">
          <SectionHeading>Technical Details</SectionHeading>
          <p className="text-base leading-[1.9] text-slate-700">{summary.technicalDetails}</p>
        </div>
      )}

      {summary.whyItMatters && (
        <div className="space-y-3">
          <SectionHeading>Why It Matters</SectionHeading>
          <p className="text-base leading-[1.9] text-slate-700">{summary.whyItMatters}</p>
        </div>
      )}
    </div>
  );
}

/** Real extracted content (or, as a last resort, description + AI summary/TLDR blended by `buildContentBlocks`). Renders every block type the redesign spec requires: paragraphs, lists, images, tables, code blocks, and quotes. */
function RawBlocksView({ blocks }: { blocks: ArticleContentBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case "heading":
            return <SectionHeading key={key}>{block.text}</SectionHeading>;

          case "paragraph":
            return (
              <p key={key} className="text-base leading-[1.9] text-slate-700">
                {block.text}
              </p>
            );

          case "quote":
            return (
              <blockquote key={key} className="border-l-4 border-slate-300 pl-5">
                <p className="text-lg italic leading-relaxed text-slate-700">{block.text}</p>
                {block.attribution && <footer className="mt-2 text-sm not-italic text-slate-500">— {block.attribution}</footer>}
              </blockquote>
            );

          case "list":
            return block.ordered ? (
              <ol key={key} className="list-decimal space-y-2.5 pl-5">
                {block.items.map((item) => (
                  <li key={item} className="text-base leading-[1.9] text-slate-700">
                    {item}
                  </li>
                ))}
              </ol>
            ) : (
              <BulletList key={key} items={block.items} />
            );

          case "image":
            return (
              <figure key={key} className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.src} alt={block.alt} className="w-full rounded-2xl object-cover" />
                {block.caption && <figcaption className="text-sm text-slate-500">{block.caption}</figcaption>}
              </figure>
            );

          case "table":
            return (
              <div key={key} className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {block.headers.map((header) => (
                        <th key={header} className="px-4 py-3 font-semibold text-slate-950">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-slate-200">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-3 text-slate-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "code":
            return <ArticleCodeBlock key={key} code={block.code} language={block.language} />;

          default:
            return null;
        }
      })}
    </div>
  );
}

/**
 * Article Detail redesign, structure item 9 - the article body. Clean
 * typography, wide line height, comfortable reading width (constrained
 * below via `max-w-[720px]`). Content precedence unchanged from before
 * the redesign (see `article-read-service.ts`'s `getArticleDetail` doc
 * comment): rewrittenArticle -> structuredSummary -> raw blocks. The
 * former "Continue Reading on {source}" CTA at the end of this component
 * has moved to the dedicated `ArticleOriginalSourceCard` (structure item
 * 10) so the source is mentioned exactly once after the metadata row.
 */
export function ArticleContent({ blocks, structuredSummary, rewrittenArticle }: ArticleContentProps) {
  return (
    <div className="max-w-[720px]">
      {rewrittenArticle ? (
        <RewrittenArticleView article={rewrittenArticle} />
      ) : structuredSummary ? (
        <StructuredSummaryView summary={structuredSummary} />
      ) : (
        <RawBlocksView blocks={blocks} />
      )}
    </div>
  );
}
