import type { ArticleAIInsights as ArticleAIInsightsData } from "@/services/articles/article-read-service";

type ArticleAIInsightsProps = {
  ai: ArticleAIInsightsData | null;
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

/**
 * "AI verilerinin gösterimi" - a single additive card for everything
 * the AI layer (`article_ai`) produces for this article: AI Summary,
 * TL;DR, AI Tags, Sentiment, Bias, plus Trust/Trending scores alongside
 * them. Product polishing phase, 3rd pass: "AI sonucu yoksa boş kart
 * gösterme, kartı tamamen gizle" - an article with no `article_ai` row
 * yet (enrichment hasn't run), or one whose row happens to carry no
 * actual generated content, renders nothing at all here rather than an
 * empty/near-empty card.
 */
export function ArticleAIInsights({ ai, trustScore, trendingScore }: ArticleAIInsightsProps) {
  const hasAnyInsight = Boolean(
    ai && (ai.summary || (ai.tldr && ai.tldr.bullets.length > 0) || ai.sentiment || ai.bias || (ai.tags && ai.tags.length > 0))
  );
  if (!hasAnyInsight) return null;

  return (
    <section
      aria-labelledby="ai-insights-title"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
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
          <h3 className="text-sm font-semibold text-slate-950">AI Summary</h3>
          <p className="mt-2 text-base leading-relaxed text-slate-700">{ai.summary}</p>
        </div>
      )}

      {ai?.tldr && ai.tldr.bullets.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">{ai.tldr.title || "TL;DR"}</h3>
          <ul className="mt-2 space-y-1.5">
            {ai.tldr.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-base leading-relaxed text-slate-700">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#2f67e8]" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(ai?.sentiment || ai?.bias) && (
        <div className="mt-5 flex flex-wrap gap-3">
          {ai?.sentiment && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-[#2f67e8]">
              Sentiment: {ai.sentiment.label} ({Math.round(ai.sentiment.confidence * 100)}%)
            </span>
          )}
          {ai?.bias && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700">
              Bias: {ai.bias.level} ({Math.round(ai.bias.confidence * 100)}%)
            </span>
          )}
        </div>
      )}

      {ai?.tags && ai.tags.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">AI Tags</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {ai.tags.map((tag) => (
              <li key={tag}>
                <span className="inline-flex rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-[#2f67e8]">
                  {tag}
                </span>
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
