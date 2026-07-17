import type { ReactNode } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";
import type { AdminArticleDetail } from "@/services/admin/admin-article-service";

type AdminArticleDetailContentProps = {
  detail: AdminArticleDetail;
};

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-800">{children}</div>
    </div>
  );
}

/**
 * Read-only body of the Article Detail Drawer (requirement 4): Title,
 * Image, Content, Source, AI Summary, TLDR, Tags, Sentiment, Bias, Trust
 * Score, Trending Score, Metrics. Server Component - all data already
 * resolved by `getAdminArticleDetail()` in `page.tsx`, no client fetch.
 * Explicitly no edit controls this phase ("Bu tur salt-okunur olacak").
 */
export function AdminArticleDetailContent({ detail }: AdminArticleDetailContentProps) {
  return (
    <div className="space-y-6">
      {detail.image && (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-100">
          <NewsImage
            src={detail.image}
            fallbackSrc={resolveFallbackImageForCategory(detail.category)}
            alt={detail.title}
            fill
            sizes="672px"
            className="object-cover"
          />
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold leading-snug text-slate-950">{detail.title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {detail.sourceName} · {detail.publishedDate}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailField label="Source">
          <a href={detail.sourceUrl} target="_blank" rel="noreferrer" className="text-[#2f67e8] hover:underline">
            {detail.sourceName}
          </a>
        </DetailField>
        <DetailField label="Category / Language / Country">
          {detail.category} · {detail.language} · {detail.country || "—"}
        </DetailField>
        <DetailField label="Trust Score">{detail.trustScore}/100</DetailField>
        <DetailField label="Trending Score">{detail.trendingScore}/100</DetailField>
      </div>

      {detail.tags.length > 0 && (
        <DetailField label="Tags">
          <div className="flex flex-wrap gap-2">
            {detail.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        </DetailField>
      )}

      <DetailField label="Content">
        <p className="whitespace-pre-line leading-relaxed text-slate-700">{detail.content || "No content stored."}</p>
      </DetailField>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-950">AI Enrichment</p>
          <StatusBadge status={detail.ai ? "healthy" : "unknown"} label={detail.ai ? "Enriched" : "Pending"} />
        </div>

        {detail.ai ? (
          <div className="space-y-4">
            {detail.ai.summary && <DetailField label="AI Summary">{detail.ai.summary}</DetailField>}

            {detail.ai.tldr && (
              <DetailField label="TL;DR">
                <p className="font-medium text-slate-800">{detail.ai.tldr.title}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {detail.ai.tldr.bullets.map((bullet, index) => (
                    <li key={index}>{bullet}</li>
                  ))}
                </ul>
              </DetailField>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Sentiment">
                {detail.ai.sentiment ? `${detail.ai.sentiment.label} (${Math.round(detail.ai.sentiment.confidence * 100)}%)` : "—"}
              </DetailField>
              <DetailField label="Bias">
                {detail.ai.bias ? `${detail.ai.bias.level} (${Math.round(detail.ai.bias.confidence * 100)}%)` : "—"}
              </DetailField>
            </div>

            {detail.ai.tags.length > 0 && (
              <DetailField label="AI Tags">
                <div className="flex flex-wrap gap-2">
                  {detail.ai.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </DetailField>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">This article has not been AI-enriched yet.</p>
        )}
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-950">Metrics</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Views", value: detail.metrics?.viewCount ?? 0 },
            { label: "Bookmarks", value: detail.metrics?.bookmarkCount ?? 0 },
            { label: "Shares", value: detail.metrics?.shareCount ?? 0 },
            { label: "Clicks", value: detail.metrics?.clickCount ?? 0 },
            { label: "Avg. Reading Time", value: `${detail.metrics?.readingTimeAvg ?? 0}m` },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <p className="text-lg font-bold text-slate-950">{metric.value}</p>
              <p className="text-xs text-slate-500">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
