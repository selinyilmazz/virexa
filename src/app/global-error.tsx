"use client";

import { useEffect } from "react";

/**
 * Last-resort Error Boundary for failures in the ROOT LAYOUT itself
 * (Next.js's `global-error.tsx` convention) - distinct from
 * `app/error.tsx`, which only catches errors in page content and still
 * relies on the root layout having rendered successfully. Deliberately
 * has no dependency on `Header`, `AuthProvider`, or any app context,
 * since the failure this catches may be in that very tree - it defines
 * its own minimal `<html>`/`<body>`, per Next.js's requirement for this
 * file. Kept intentionally plain (inline styles, no Tailwind utility
 * reliance beyond what's unavoidable) so it renders even if something
 * upstream of styling itself is broken.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 420, textAlign: "center", padding: "48px 24px", borderRadius: 24, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#020617", margin: "0 0 8px" }}>Virexa is temporarily unavailable</h1>
          <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.6, margin: "0 0 24px" }}>
            Something went wrong loading the application. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ backgroundColor: "#2f67e8", color: "#ffffff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
