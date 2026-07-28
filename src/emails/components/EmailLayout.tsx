import { Body, Column, Container, Head, Hr, Html, Link, Preview, Row, Section, Text, Tailwind } from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Shared branded shell every Virexa email is built from (Newsletter
 * Phase 2, requirement 3: "reusable... so future emails - weekly
 * newsletters, announcements, etc. - can reuse the same infrastructure").
 * `NewsletterWelcomeEmail` is the first template built on this; a future
 * weekly-digest or announcement email should wrap its own body content in
 * this same `EmailLayout` rather than rebuilding the header/footer.
 *
 * Brand header is a plain colored badge + wordmark lockup, not an
 * `<Img src=".../logo.png">` - there is no raster Virexa logo asset in
 * `public/` yet (the real site header uses an inline `<svg>`, which most
 * email clients strip entirely or render unreliably, and Gmail/Outlook
 * both block remote images by default until the recipient explicitly
 * allows them). A text+color lockup always renders, with zero image
 * dependency - if a real exported PNG/SVG logo is added to `public/`
 * later, swap this section for an `<Img>` pointed at its absolute URL
 * (email clients can't resolve relative paths).
 *
 * Uses React Email's `Tailwind` wrapper so this can lean on the same
 * `#2f67e8` brand blue and slate palette the rest of the app already
 * uses (see `tailwind.config`-less v4 tokens used throughout
 * `src/components`) - `Tailwind` compiles these classes to inline styles
 * at render time, since email clients don't load stylesheets.
 */

const BRAND_BLUE = "#2f67e8";
const SERIF_STACK = "Georgia, 'Times New Roman', Times, serif";

type EmailLayoutProps = {
  /** Inbox preview snippet (the gray text after the subject line in Gmail/Outlook/Apple Mail). Keep under ~100 characters. */
  previewText: string;
  children: ReactNode;
  /**
   * Footer unsubscribe link. Optional so a future non-subscriber-list
   * email (e.g. a transactional "password changed" notice, if this app
   * ever sends one) can render this same layout without a dangling
   * "you're receiving this because you're subscribed" line that wouldn't
   * be true for it.
   */
  unsubscribeUrl?: string;
  /** Absolute URL for "Visit Virexa" in the footer - always `env.site.url`, passed in by the caller rather than imported here (keeps this a pure presentational component with no server-only imports, safe for `react-email`'s local preview tooling too). */
  siteUrl: string;
};

export function EmailLayout({ previewText, children, unsubscribeUrl, siteUrl }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body style={{ backgroundColor: "#f8fafc", fontFamily: "Helvetica, Arial, sans-serif", margin: 0, padding: "32px 16px" }}>
          <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0" }}>
            {/* Brand header */}
            <Section style={{ backgroundColor: BRAND_BLUE, padding: "32px 24px", textAlign: "center" }}>
              <Row>
                <Column align="right" style={{ width: "50%" }}>
                  <div
                    style={{
                      display: "inline-block",
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: "#ffffff",
                      textAlign: "center",
                      lineHeight: "40px",
                      fontFamily: SERIF_STACK,
                      fontWeight: 700,
                      fontSize: 20,
                      color: BRAND_BLUE,
                    }}
                  >
                    V
                  </div>
                </Column>
                <Column align="left" style={{ width: "50%", paddingLeft: 10 }}>
                  <Text style={{ margin: 0, fontFamily: SERIF_STACK, fontWeight: 700, fontSize: 26, color: "#ffffff", letterSpacing: "-0.5px" }}>Virexa</Text>
                </Column>
              </Row>
            </Section>

            {/* Body content - per-email */}
            <Section style={{ padding: "32px 32px 8px" }}>{children}</Section>

            <Hr style={{ borderColor: "#e2e8f0", margin: "32px 0 0" }} />

            {/* Footer */}
            <Section style={{ padding: "20px 32px 32px", textAlign: "center" }}>
              <Text style={{ margin: "0 0 6px", fontSize: 12, color: "#94a3b8" }}>
                Virexa - AI &amp; developer news, curated daily.
              </Text>
              <Text style={{ margin: "0 0 6px", fontSize: 12, color: "#94a3b8" }}>
                <Link href={siteUrl} style={{ color: "#94a3b8", textDecoration: "underline" }}>
                  {siteUrl.replace(/^https?:\/\//, "")}
                </Link>
              </Text>
              {unsubscribeUrl && (
                <Text style={{ margin: "12px 0 0", fontSize: 12, color: "#94a3b8" }}>
                  You&apos;re receiving this because you subscribed to the Virexa newsletter.{" "}
                  <Link href={unsubscribeUrl} style={{ color: "#94a3b8", textDecoration: "underline" }}>
                    Unsubscribe
                  </Link>
                </Text>
              )}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
