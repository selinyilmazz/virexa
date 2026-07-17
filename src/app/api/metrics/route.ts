import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { createArticleRepository } from "@/repositories/article-repository";
import {
  decrementArticleBookmark,
  incrementArticleBookmark,
  incrementArticleShare,
  recordArticleReadingTime,
} from "@/services/articles/article-metrics-service";

/**
 * Best-effort metrics endpoint for actions that happen client-side
 * (bookmark toggle, share clicks, a future reading-time beacon) and
 * therefore can't call the service-role-only metrics service directly
 * (see `services/articles/article-metrics-service.ts` - the service
 * role key must never reach the browser). Resolves `slug` -> article id
 * via the public, RLS-respecting server client (reads are open to
 * everyone), then delegates the actual counter write to the metrics
 * service.
 *
 * Always responds 200 with `{ ok: boolean }` - this is a fire-and-forget
 * side channel, not something a caller should treat as authoritative or
 * retry aggressively on failure. Not a page (no UI), so it doesn't
 * count against this task's "no new pages" rule.
 *
 * Production Readiness phase: this is the one fully public,
 * unauthenticated write endpoint in the app (every other write route
 * requires `getAdminUserOrNull()`), so it's the one rate-limited via
 * `lib/rate-limit.ts` - see that file's doc comment for scope/caveats.
 */

const RATE_LIMIT = 60; // requests
const RATE_WINDOW_MS = 60_000; // per minute, per client identifier

const bodySchema = z.object({
  slug: z.string().trim().min(1),
  action: z.enum(["bookmark_add", "bookmark_remove", "share", "reading_time"]),
  seconds: z.number().positive().optional(),
});

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`metrics:${clientId}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const articleRepository = createArticleRepository(supabase);
    const article = await articleRepository.getBySlug(body.slug);

    if (!article) {
      // Article isn't persisted (or was removed) - nothing to attach a
      // metric to. Not an error worth surfacing to the caller.
      return NextResponse.json({ ok: true, skipped: true });
    }

    switch (body.action) {
      case "bookmark_add":
        await incrementArticleBookmark(article.id);
        break;
      case "bookmark_remove":
        await decrementArticleBookmark(article.id);
        break;
      case "share":
        await incrementArticleShare(article.id);
        break;
      case "reading_time":
        await recordArticleReadingTime(article.id, body.seconds ?? 0);
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/metrics] failed:", error);
    return NextResponse.json({ ok: false });
  }
}
