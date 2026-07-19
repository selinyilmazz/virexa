"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";

/**
 * The 5 safe, non-destructive Runtime Operations (requirement 2): Run
 * Pipeline, Retry Failed Jobs, Refresh Cache, Recalculate Trending,
 * Recalculate Trust Scores. Each button is an `AdminActionButton`
 * posting to `/api/admin/runtime/actions` - loading/confirmation/
 * success/error/toast all come from that shared component
 * (requirement 7). `router.refresh()` (built into `AdminActionButton`)
 * re-pulls `RuntimeStatusSection`'s data after a queued action, so the
 * Last Run/Queue numbers above update once the background job progresses.
 */
export function RuntimeActionsPanel() {
  return (
    <div className="flex flex-wrap gap-3">
      <AdminActionButton
        label="Run Pipeline"
        endpoint="/api/admin/runtime/actions"
        buildBody={() => ({ action: "run-pipeline" })}
        confirmTitle="Run the full news pipeline?"
        confirmDescription="Fetches, normalizes, dedupes, scores, and persists articles from every configured source. This queues a background job and returns immediately."
        confirmLabel="Run Pipeline"
        successMessage={(json) => (typeof json.message === "string" ? json.message : "Pipeline run queued.")}
        variant="primary"
      />
      <AdminActionButton
        label="Retry Failed Jobs"
        endpoint="/api/admin/runtime/actions"
        buildBody={() => ({ action: "retry-failed" })}
        successMessage={(json) => (typeof json.message === "string" ? json.message : "Failed jobs re-queued.")}
        variant="secondary"
      />
      <AdminActionButton
        label="Refresh Cache"
        endpoint="/api/admin/runtime/actions"
        buildBody={() => ({ action: "refresh-cache" })}
        successMessage={(json) => (typeof json.message === "string" ? json.message : "Cache refresh queued.")}
        variant="secondary"
      />
      <AdminActionButton
        label="Recalculate Trending"
        endpoint="/api/admin/runtime/actions"
        buildBody={() => ({ action: "recalculate-trending" })}
        successMessage={(json) => (typeof json.message === "string" ? json.message : "Trending recalculation queued.")}
        variant="secondary"
      />
      <AdminActionButton
        label="Recalculate Trust Scores"
        endpoint="/api/admin/runtime/actions"
        buildBody={() => ({ action: "recalculate-trust" })}
        confirmTitle="Recalculate trust scores?"
        confirmDescription="Re-syncs every stored article's trust score to match its source's current trust score. Runs immediately and only touches articles whose score has actually changed."
        confirmLabel="Recalculate"
        successMessage={(json) => (typeof json.message === "string" ? json.message : "Trust scores recalculated.")}
        variant="secondary"
      />
      <AdminActionButton
        label="Backfill Real Images"
        endpoint="/api/admin/runtime/actions"
        buildBody={() => ({ action: "backfill-images" })}
        confirmTitle="Backfill real photos for older articles?"
        confirmDescription="Searches Pexels/Unsplash/Pixabay/Wikimedia Commons for a real, topical photo for up to 40 already-stored articles still sitting on the local category placeholder. Runs immediately; click again to work through more of the table."
        confirmLabel="Backfill Images"
        successMessage={(json) =>
          typeof json.message === "string" ? json.message : "Image backfill complete."
        }
        variant="secondary"
      />
      <AdminActionButton
        label="Backfill Article Content"
        endpoint="/api/admin/runtime/actions"
        buildBody={() => ({ action: "backfill-content" })}
        confirmTitle="Backfill full content for older articles?"
        confirmDescription="Fetches the source page for up to 15 already-stored articles whose content is still missing or too short to read, and extracts a fuller article body. Runs immediately; click again to work through more of the table."
        confirmLabel="Backfill Content"
        successMessage={(json) =>
          typeof json.message === "string" ? json.message : "Content backfill complete."
        }
        variant="secondary"
      />
      <AdminActionButton
        label="Backfill AI Enrichment"
        endpoint="/api/admin/runtime/actions"
        buildBody={() => ({ action: "backfill-ai-enrichment" })}
        confirmTitle="Backfill AI Summary + Key Takeaways for older articles?"
        confirmDescription="Generates AI Summary and Key Takeaways for up to 60 already-stored articles that are still missing one or both - the same broad-tier AI capabilities a live pipeline run generates for new articles. Runs immediately; click again to work through more of the table."
        confirmLabel="Backfill AI Enrichment"
        successMessage={(json) =>
          typeof json.message === "string" ? json.message : "AI enrichment backfill complete."
        }
        variant="secondary"
      />
    </div>
  );
}
