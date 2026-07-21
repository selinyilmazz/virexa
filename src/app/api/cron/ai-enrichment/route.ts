import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AI_ENRICHMENT_JOB_TYPES } from "@/runtime/jobs";
import { runtimeConfig } from "@/runtime/config";
import { runtimeEngine } from "@/runtime/engine";
import type { JobRunSummary } from "@/runtime/types";

/**
 * External, production-safe trigger for AI enrichment - the counterpart
 * to `/api/cron/news-fetch` after the production architecture fix that
 * split AI enrichment out of the ingestion pipeline entirely ("AI
 * enrichment ayrı queue/job olarak çalışsın").
 *
 * Runs all 9 AI capability jobs (`AI_ENRICHMENT_JOB_TYPES`, from
 * `runtime/jobs/index.ts`) CONCURRENTLY in one invocation via
 * `Promise.all` of `runtimeEngine.runJob(...)` calls - not sequentially.
 * This only actually parallelizes because `runtimeConfig.concurrency`
 * was raised to 10 specifically for this route (see that config's doc
 * comment); each job is independently small/bounded
 * (`services/ai/ai-enrichment-runner.ts`: ~20 articles, concurrency-5
 * provider calls, `maxAttempts: 1`, `timeoutMs: 90_000`), so the whole
 * request's wall time is bounded by the SLOWEST single capability
 * (~60-90s), not the sum of all 9 - comfortably under this route's own
 * `maxDuration` (300s), with real margin. One capability job failing
 * (a DB error, a provider outage) never stops the other 8 - each
 * `runtimeEngine.runJob()` call is awaited independently below and its
 * own outcome reported per capability, exactly mirroring how
 * `runAIEnrichmentCapability()` itself isolates one article's failure
 * from the rest of its own batch.
 *
 * Same `CRON_SECRET` auth mechanism as `/api/cron/news-fetch` - see that
 * route's doc comment for why (Vercel Cron's native
 * `Authorization: Bearer <secret>` header, fails closed if unconfigured).
 * Scheduled independently in `vercel.json` so AI enrichment keeps
 * clearing its backlog on its own cadence regardless of how often
 * `news-fetch` itself runs ("AI işlemlerinin arka planda kademeli olarak
 * bitmesi").
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const configuredSecret = runtimeConfig.cronSecret;
  return Boolean(configuredSecret) && request.headers.get("authorization") === `Bearer ${configuredSecret}`;
}

async function triggerAIEnrichment(request: NextRequest): Promise<NextResponse> {
  // TEMPORARY DEBUG LOGGING - "runtime_job_runs where job_type like 'ai%'"
  // returns 0 rows in production, meaning `runtimeEngine.runJob()` below
  // is never actually reached (it persists a row on EVERY settle, success
  // or failure - see `engine.ts`'s `persistRuntimeJobRun`). Every code
  // path in this file, `runtime/jobs/index.ts`'s job registry, and
  // `vercel.json` has been traced and is internally consistent (see the
  // full trace in chat) - the remaining candidates are all outside this
  // file: (1) this route was never actually deployed yet, (2) Vercel
  // Cron never invokes it at all (a real risk - Vercel's Hobby plan only
  // allows daily cron; this route is scheduled every 15 minutes in
  // vercel.json), or (3) it IS invoked but fails `isAuthorized()` and
  // returns 401 before ever reaching `runtimeEngine.runJob()` - the exact
  // same failure mode `/api/cron/news-fetch` had before CRON_SECRET was
  // fixed. This log block (mirrors that route's earlier debug logging)
  // settles which one it is - check Vercel's function logs for
  // "[ai-cron-debug]" after the next real or manual invocation. Remove
  // once resolved.
  console.log("[ai-cron-debug] /api/cron/ai-enrichment invoked at", new Date().toISOString());
  console.log("[ai-cron-debug] x-vercel-cron header:", request.headers.get("x-vercel-cron"));
  console.log("[ai-cron-debug] Authorization header present:", request.headers.get("authorization") !== null);
  console.log("[ai-cron-debug] CRON_SECRET configured:", Boolean(runtimeConfig.cronSecret));
  console.log("[ai-cron-debug] isAuthorized result:", isAuthorized(request));

  if (!isAuthorized(request)) {
    console.log("[ai-cron-debug] Rejected with 401 - runtimeEngine.runJob() never called this invocation.");
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  console.log(`[ai-cron-debug] Authorized - enqueueing ${AI_ENRICHMENT_JOB_TYPES.length} job(s):`, AI_ENRICHMENT_JOB_TYPES);

  const settled = await Promise.allSettled(
    AI_ENRICHMENT_JOB_TYPES.map((jobType) => runtimeEngine.runJob(jobType))
  );

  console.log(
    "[ai-cron-debug] All jobs settled:",
    settled.map((result, index) => ({
      jobType: AI_ENRICHMENT_JOB_TYPES[index],
      outcome: result.status === "fulfilled" ? result.value.status : `rejected: ${String(result.reason)}`,
    }))
  );

  const results: Record<string, JobRunSummary | { status: "failed"; error: string }> = {};
  let anyFailed = false;

  settled.forEach((result, index) => {
    const jobType = AI_ENRICHMENT_JOB_TYPES[index];
    if (result.status === "fulfilled") {
      results[jobType] = result.value;
      if (result.value.status === "failed") anyFailed = true;
    } else {
      anyFailed = true;
      const error = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error(`[api/cron/ai-enrichment] "${jobType}" failed:`, result.reason);
      results[jobType] = { status: "failed", error };
    }
  });

  // `ok: false` when ANY capability failed, but every OTHER capability's
  // result is still returned in full - a partial failure here is
  // reported, not hidden, while never preventing the other 8 from
  // running or being visible in the response.
  return NextResponse.json({ ok: !anyFailed, results });
}

/** Vercel Cron Jobs (and most external schedulers) invoke via GET. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return triggerAIEnrichment(request);
}

/** POST too, for callers (GitHub Actions, a manual curl) that prefer it - identical behavior to GET. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return triggerAIEnrichment(request);
}
