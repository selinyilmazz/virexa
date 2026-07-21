import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runtimeConfig } from "@/runtime/config";
import { runtimeEngine } from "@/runtime/engine";

/**
 * The real, external, production-safe trigger for the news pipeline
 * ("Production'da çalışacak şekilde scheduler nasıl ayağa kalkıyor?").
 *
 * `runtime/scheduler/scheduler.ts`'s `RuntimeScheduler` is `setInterval`-
 * based and lives entirely in one process's memory - it works for a
 * persistent, self-hosted Node server, but NOT on serverless platforms
 * like Vercel, where each invocation can be a fresh, short-lived process
 * with no memory of any previous one (see that file's and `engine.ts`'s
 * doc comments, and the README's "Known Limitations"). Nothing in this
 * codebase ever called `runtimeEngine.start()` automatically, and even a
 * running scheduler only had `rss-sync`/`newsapi-sync`/`gnews-sync`/
 * `hn-sync`/`ai-*` in its recurring schedule (`schedule-definitions.ts`)
 * - none of which persist to Supabase (they only refresh the legacy
 * in-memory `live-articles` cache the current, database-backed pages no
 * longer read from). Only `news-fetch` runs the full pipeline INCLUDING
 * the database step, so it's the one job that actually keeps the live
 * site's real content fresh - this route exists to trigger exactly that
 * job from an external scheduler (Vercel Cron - see `vercel.json` at the
 * repo root - GitHub Actions, or any other periodic HTTP caller).
 *
 * Secured with `CRON_SECRET` (`Authorization: Bearer <secret>`), the
 * exact mechanism Vercel Cron Jobs use natively (Vercel automatically
 * sends that header when `CRON_SECRET` is set as a project environment
 * variable - see Vercel's "Securing cron jobs" docs). Fails closed: if
 * `CRON_SECRET` isn't configured at all, every request is rejected
 * rather than the endpoint being left wide open - this route can kick
 * off real AI provider spend and real database writes, so it must never
 * be callable by an unauthenticated stranger who finds the URL.
 *
 * Runs the job to completion (not fire-and-forget) so the caller - and
 * Vercel's own Cron Jobs invocation log - gets a real, immediate
 * success/failure result and step-by-step counts, rather than a bare
 * "queued" acknowledgment that can't be traced back to what actually
 * happened. `maxDuration` is raised accordingly; if a deployment's plan
 * caps function duration below what a full run needs, split ingestion
 * across more frequent, smaller cron hits (e.g. dedicated per-provider
 * routes) rather than trying to silently background the work - Vercel
 * serverless functions are not guaranteed to keep running once a
 * response has been sent unless explicitly kept alive.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const configuredSecret = runtimeConfig.cronSecret;
  const authHeader = request.headers.get("authorization");

  // TEMPORARY DEBUG LOGGING - production 401 investigation (all cron
  // requests rejected despite CRON_SECRET reportedly being read
  // correctly). Remove once the mismatch is found - this prints the
  // real secret value to Vercel's function logs, which must not stay
  // in place after debugging.
  console.log("[cron-debug] Configured CRON_SECRET:", configuredSecret);
  console.log("[cron-debug] Configured CRON_SECRET length:", configuredSecret?.length ?? 0);
  console.log("[cron-debug] Authorization header:", authHeader);
  console.log("[cron-debug] Authorization header length:", authHeader?.length ?? 0);
  console.log("[cron-debug] x-vercel-cron:", request.headers.get("x-vercel-cron"));
  console.log("[cron-debug] Expected header:", configuredSecret ? `Bearer ${configuredSecret}` : "(no secret configured - configuredSecret is falsy)");
  console.log("[cron-debug] Exact match:", authHeader === `Bearer ${configuredSecret}`);

  if (!configuredSecret) return false;
  return authHeader === `Bearer ${configuredSecret}`;
}

async function triggerNewsFetch(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const summary = await runtimeEngine.runJob("news-fetch");
    return NextResponse.json({ ok: summary.status === "completed", ...summary });
  } catch (error) {
    console.error("[api/cron/news-fetch] job failed:", error);
    const message = error instanceof Error ? error.message : "Job failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** Vercel Cron Jobs (and most external schedulers) invoke via GET. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return triggerNewsFetch(request);
}

/** POST too, for callers (GitHub Actions, a manual curl) that prefer it - identical behavior to GET. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return triggerNewsFetch(request);
}
