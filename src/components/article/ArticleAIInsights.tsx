import type { ArticleAIInsights as ArticleAIInsightsData } from "@/services/articles/article-read-service";
import type { StoredArticleRewrite } from "@/types/database";

type ArticleAIInsightsProps = {
  ai: ArticleAIInsightsData | null;
  /** Source for "Key Points" and "Why This News Matters" (product polishing phase, 4th pass, item 8) - reuses the same AI rewrite the article body renders, rather than a second overlapping AI capability. */
  rewrittenArticle: StoredArticleRewrite | null;
  trustScore: number;
  trendingScore: number;
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-950">{clamped}/100</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#2f67e8]" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function EntityChipList({ label, entities }: { label: string; entities: string[] }) {
  if (entities.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{label}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {entities.map((entity) => (
          <li key={entity}>
            <span className="inline-flex rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700">{entity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "AI verilerinin gösterimi" - a single additive card for everything the
 * AI layer produces for this article (product polishing phase, 4th
 * pass, item 8's expanded field set; 5th pass: Key Points now shows for
 * every article, not just trending ones): Short Summary, TL;DR, Key
 * Points, Companies/Technologies/People Mentioned, Why This News
 * Matters, Trust Score, and Overall Sentiment Analysis.
 *
 * "Key Points" prefers the standalone `ai.keyTakeaways` (broad tier -
 * generated for every article a pipeline run touches) and falls back to
 * `rewrittenArticle.keyHighlights` only when no standalone takeaways
 * exist yet but a rewrite does (narrow, trending-only tier) - so this
 * section shows for the widest possible set of articles rather than
 * only ones that got the more expensive full rewrite. "Why This News
 * Matters" only ever comes from `rewrittenArticle` (Key Takeaways has
 * no equivalent field), so it's still trending-tier-only.
 *
 * "AI sonucu yoksa boş kart gösterme, kartı tamamen gizle" - renders
 * nothing at all when there's no AI-generated content of ANY kind for
 * this article yet.
 */
export function ArticleAIInsights({ ai, rewrittenArticle, trustScore, trendingScore }: ArticleAIInsightsProps) {
  const keyPoints = ai?.keyTakeaways?.points ?? rewrittenArticle?.keyHighlights ?? [];
  const whyItMatters = rewrittenArticle?.whyItMatters ?? "";
  const entities = ai?.entities;
  const hasEntities = Boolean(entities && (entities.companies.length > 0 || entities.technologies.length > 0 || entities.people.length > 0));

  const hasAnyInsight = Boolean(
    ai &&
      (ai.summary ||
        (ai.tldr && ai.tldr.bullets.length > 0) ||
        ai.sentiment ||
        ai.bias ||
        (ai.tags && ai.tags.length > 0) ||
        hasEntities) ||
      keyPoints.length > 0 ||
      whyItMatters
  );
  if (!hasAnyInsight) return null;

  return (
    <section aria-labelledby="ai-insights-title" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-2xl">
          🤖
        </span>
        <h2 id="ai-insights-title" className="text-2xl font-bold tracking-tight text-slate-950">
          AI Insights
        </h2>
      </div>

      {ai?.summary && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">Short Summary</h3>
          <p className="mt-2 text-base leading-relaxed text-slate-700">{ai.summary}</p>
        </div>
      )}

      {ai?.tldr && ai.tldr.bullets.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">{ai.tldr.title || "TL;DR"}</h3>
          <ul className="mt-2 space-y-1.5">
            {ai.tldr.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-base leading-relaxed text-slate-700">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-slate-400" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      )}

      {keyPoints.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">Key Points</h3>
          <ul className="mt-2 space-y-1.5">
            {keyPoints.map((point) => (
              <li key={point} className="flex items-start gap-2 text-base leading-relaxed text-slate-700">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-slate-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {whyItMatters && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">Why This News Matters</h3>
          <p className="mt-2 text-base leading-relaxed text-slate-700">{whyItMatters}</p>
        </div>
      )}

      {hasEntities && entities && (
        <div className="mt-5 space-y-4">
          <EntityChipList label="Companies Mentioned" entities={entities.companies} />
          <EntityChipList label="Technologies Mentioned" entities={entities.technologies} />
          <EntityChipList label="People Mentioned" entities={entities.people} />
        </div>
      )}

      {(ai?.sentiment || ai?.bias) && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">Overall Sentiment Analysis</h3>
          <div className="mt-2 flex flex-wrap gap-3">
            {ai?.sentiment && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700">
                {ai.sentiment.label} ({Math.round(ai.sentiment.confidence * 100)}%)
              </span>
            )}
            {ai?.bias && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700">
                Bias: {ai.bias.level} ({Math.round(ai.bias.confidence * 100)}%)
              </span>
            )}
          </div>
        </div>
      )}

      {ai?.tags && ai.tags.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">AI Tags</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {ai.tags.map((tag) => (
              <li key={tag}>
                <span className="inline-flex rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700">{tag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
        <ScoreBar label="Trust Score" value={trustScore} />
        <ScoreBar label="Trending Score" value={trendingScore} />
      </div>
    </section>
  );
}
