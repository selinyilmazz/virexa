import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { runtimeEngine } from "@/runtime/engine";
import { recalculateTrustScores } from "@/services/admin/admin-runtime-ops-service";
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
 *
 * Every action `runtimeEngine.enqueueJob()` reaches the existing job
 * registry unmodified (`runtime/jobs/*`) - this route adds no new job
 * types, no scheduler changes, nothing to the queue's internals
 * ("Runtime mimarisini bozma"). Enqueue-and-return (not
 * `runJob`/await-to-completion): the UI gets an immediate response and
 * the job runs in the background, same as every other manual trigger
 * this app already supports.
 */

const ACTIONS = ["run-pipeline", "refresh-cache", "recalculate-trending", "retry-failed", "recalculate-trust"] as const;

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
