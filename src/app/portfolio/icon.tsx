import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Per-segment favicon override (Next.js `icon` file convention - unlike
 * `favicon.ico`, `icon` is valid at any route segment, not just the app
 * root). This makes every page under `/portfolio` serve its own tab
 * icon instead of the root `src/app/icon.svg`/`favicon.ico`, which stay
 * completely untouched and keep serving Virexa's own icon for the rest
 * of the site.
 *
 * Same "SY." wordmark as `PortfolioNav.tsx`, rendered as a standalone
 * monogram - dark background, the portfolio's own violet accent
 * (`--portfolio-accent`'s dark-mode value, hardcoded here since
 * `ImageResponse` renders in an isolated context with no access to CSS
 * custom properties). No shape, color, or layout borrowed from Virexa's
 * own icon.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090f",
          borderRadius: 7,
          color: "#8b5cf6",
          fontFamily: "sans-serif",
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: -0.5,
        }}
      >
        SY
      </div>
    ),
    { ...size },
  );
}
