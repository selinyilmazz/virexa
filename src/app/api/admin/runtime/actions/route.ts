import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { runtimeEngine } from "@/runtime/engine";
import {
  backfillArticleAIEnrichment,
  backfillArticleContent,
  backfillArticleImages,
  recalculateTrustScores,
} from "@/services/admin/admin-runtime-ops-service";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";

/**
 * Admin Runtime Operations (requirement 2). Every action here is
 * explicitly safe/non-destructive - "Sadece güvenli işlemler ... Yıkıcı
 * işlemler ekleme":
 *
 * - run-pipeline           -> enqueues the existing `news-fetch` job
 * - refresh-cache          -> enqueues the existing `cache-refresh` job
 * - recalculate-trending   -> enqueues the existing `trending` job
 * - retry-failed           -> re-enqueues every currently-`failed` queue
 *                              entry under its own job type (a fresh
 *                              attempt, not a queue-internal replay)
 * - recalculate-trust      -> `admin-runtime-ops-service.ts` (no matching
 *                              job type exists for this one - see that
 *                              file's doc comment for why it's a direct
 *                              repository operation instead)
 * - backfill-images        -> `admin-runtime-ops-service.ts`'s
 *                              `backfillArticleImages` - same "no
 *                              matching job type, plain repository
 *                              operation" shape as recalculate-trust
 * - backfill-content       -> `admin-runtime-ops-service.ts`'s
 *                              `backfillArticleContent` - same shape,
 *                              for thin/missing article body text
 * - backfill-ai-enrichment -> `admin-runtime-ops-service.ts`'s
 *                              `backfillArticleAIEnrichment`, which now
 *                              just calls the shared
 *                              `runAllAIEnrichmentCapabilities()`
 *                              (`services/ai/ai-enrichment-runner.ts`) -
 *                              retroactively generates all 9 AI
 *                              capabilities for old articles still
 *                              missing any of them, the same underlying
 *                              logic the 9 independent AI jobs/cron route
 *                              use
 *
 * Every action `runtimeEngine.enqueueJob()` reaches the existing job
 * registry unmodified (`runtime/jobs/*`) - this route adds no new job
 * types, no scheduler changes, nothing to the queue's internals
 * ("Runtime mimarisini bozma"). Enqueue-and-return (not
 * `runJob`/await-to-completion): the UI gets an immediate response and
 * the job runs in the background, same as every other manual trigger
 * this app already supports.
 */

const ACTIONS = [
  "run-pipeline",
  "refresh-cache",
  "recalculate-trending",
  "retry-failed",
  "recalculate-trust",
  "backfill-images",
  "backfill-content",
  "backfill-ai-enrichment",
] as const;

const bodySchema = z.object({
  action: z.enum(ACTIONS),
});

export async function POST(request: Request) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

  let action: (typeof ACTIONS)[number];
  try {
    ({ action } = bodySchema.parse(await request.json()));
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  try {
    let message: string;
    let metadata: Record<string, unknown> = {};

    switch (action) {
      case "run-pipeline": {
        const jobId = runtimeEngine.enqueueJob("news-fetch");
        message = "Pipeline run queued.";
        metadata = { jobId };
        break;
      }
      case "refresh-cache": {
        const jobId = runtimeEngine.enqueueJob("cache-refresh");
        message = "Cache refresh queued.";
        metadata = { jobId };
        break;
      }
      case "recalculate-trending": {
        const jobId = runtimeEngine.enqueueJob("trending");
        message = "Trending recalculation queued.";
        metadata = { jobId };
        break;
      }
      case "retry-failed": {
        const failed = runtimeEngine.queue.list("failed");
        const jobIds = failed.map((entry) => runtimeEngine.enqueueJob(entry.jobType));
        message = `${jobIds.length} failed job(s) re-queued.`;
        metadata = { count: jobIds.length, jobIds };
        break;
      }
      case "recalculate-trust": {
        const result = await recalculateTrustScores();
        message = `Checked ${result.checked} article(s), updated ${result.updated}.`;
        metadata = result;
        break;
      }
      case "backfill-images": {
        const result = await backfillArticleImages();
        message =
          result.checked === 0
            ? "No articles needed a real-photo backfill."
            : `Checked ${result.checked} article(s), found real photos for ${result.updated}.`;
        metadata = result;
        break;
      }
      case "backfill-content": {
        const result = await backfillArticleContent();
        message =
          result.checked === 0
            ? "No articles needed a content backfill."
            : `Checked ${result.checked} article(s), extracted fuller content for ${result.updated}.`;
        metadata = result;
        break;
      }
      case "backfill-ai-enrichment": {
        const result = await backfillArticleAIEnrichment();
        // Bug fix: this used to branch on `result.updated === 0`, which
        // conflates two very different states - "no articles are missing
        // AI enrichment" (checked === 0) vs. "articles ARE missing it,
        // but nothing could actually be generated for them" (checked > 0,
        // updated === 0 - e.g. no AI provider configured, so every
        // aiService.getX() call short-circuits to null before ever
        // reaching a provider). Confirmed via SQL: `article_ai` had 0
        // rows while `articles` had many, yet this said "No articles
        // needed an AI enrichment backfill" - the detection
        // (`runAIEnrichmentCapability`'s `isMissing` check in
        // `ai-enrichment-runner.ts`) was finding every article as a
        // candidate correctly; this message was just reporting the wrong
        // thing when generation produced zero updates for a nonzero
        // candidate pool.
        message =
          result.checked === 0
            ? "No articles needed an AI enrichment backfill."
            : result.updated === 0
              ? `Found ${result.checked} article(s) missing AI enrichment, but none could be generated. Check that an AI provider is configured (OPENAI_API_KEY / ANTHROPIC_API_KEY / OPENROUTER_API_KEY).`
              : `Checked ${result.checked} article(s), generated ${result.updated} AI field(s) across all 9 capabilities (Summary, TL;DR, Key Takeaways, Long Summary, Rewrite, Entities, Tags, Sentiment, Bias).`;
        metadata = result;
        break;
      }
    }

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: `runtime.${action.replace(/-/g, "_")}`,
      targetType: "runtime",
      metadata,
    });

    return NextResponse.json({ ok: true, message, ...metadata });
  } catch (error) {
    console.error("[api/admin/runtime/actions] action failed:", error);
    const message = error instanceof Error ? error.message : "Action failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
