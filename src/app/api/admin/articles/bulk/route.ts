import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createArticleRepository } from "@/repositories/article-repository";
import { createSourceRepository } from "@/repositories/source-repository";
import { calculateTrendingScore } from "@/lib/news/trending-score";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";
import type { Source } from "@/types/news";
import type { ArticleSourceRow } from "@/types/database";

/**
 * Bulk Articles operations (requirement 6): "Toplu refresh" - recomputes
 * `trending_score` for a selected batch of stored articles and persists
 * it via the same `ArticleRepository.updateTrendingScores` the
 * `trending` runtime job already uses. Reuses the News Engine's own
 * `calculateTrendingScore()` (`lib/news/trending-score.ts`) unmodified -
 * "News Engine'i değiştirme" means don't edit it, not that admin code
 * can't call its exported, pure function. No destructive action.
 */

const bodySchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1, "At least one article id is required.").max(200),
  action: z.literal("refresh-trending"),
});

/** `calculateTrendingScore` only reads `source.official` off its `source` param - every other `Source` field is irrelevant to the computation. This maps just what's needed from the stored `article_sources` row into a valid `Source` shape, without inventing a dependency between the two type systems beyond this one call site. */
function toMinimalSource(row: ArticleSourceRow): Source {
  return {
    id: row.id,
    name: row.name,
    website: row.domain,
    country: row.country,
    language: "en",
    trustScore: row.trust_score,
    official: row.official,
  };
}

export async function POST(request: Request) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid request body.";
    return NextResponse.json({ ok: false, error: message ?? "Invalid request body." }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 503 });
  }

  try {
    const articleRepository = createArticleRepository(supabase);
    const sourceRepository = createSourceRepository(supabase);

    const [articles, sources] = await Promise.all([articleRepository.getByIds(body.ids), sourceRepository.list()]);
    const sourceById = new Map(sources.map((source) => [source.id, source]));

    const updates = articles
      .map((article) => {
        const source = sourceById.get(article.source_id);
        if (!source) return null;
        const trendingScore = calculateTrendingScore({
          publishedAt: article.published_at,
          trustScore: article.trust_score,
          source: toMinimalSource(source),
        });
        return { id: article.id, trendingScore };
      })
      .filter((entry): entry is { id: string; trendingScore: number } => entry !== null);

    if (updates.length > 0) {
      await articleRepository.updateTrendingScores(updates);
    }

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "article.bulk_trending_refreshed",
      targetType: "article",
      metadata: { requested: body.ids.length, updated: updates.length },
    });

    return NextResponse.json({ ok: true, updated: updates.length });
  } catch (error) {
    console.error("[api/admin/articles/bulk] refresh failed:", error);
    return NextResponse.json({ ok: false, error: "Bulk refresh failed." }, { status: 500 });
  }
}
