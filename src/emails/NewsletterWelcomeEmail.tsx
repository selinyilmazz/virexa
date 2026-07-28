import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "@/emails/components/EmailLayout";

/**
 * The Virexa newsletter welcome email (Newsletter Phase 2, requirement 5).
 * Sent once, from `services/email/newsletter-emails.tsx`, right after a
 * successful subscribe or resubscribe - see
 * `newsletter-service.ts`'s `subscribeToNewsletter()`.
 *
 * Pure presentational component (no server-only imports) so it can be
 * rendered by the `react-email` local preview/dev tool the same way any
 * other template can - every real value (`siteUrl`, `unsubscribeUrl`) is
 * passed in as a prop by the caller.
 */

const BRAND_BLUE = "#2f67e8";

export type NewsletterWelcomeEmailProps = {
  siteUrl: string;
  unsubscribeUrl: string;
};

export function NewsletterWelcomeEmail({ siteUrl, unsubscribeUrl }: NewsletterWelcomeEmailProps) {
  return (
    <EmailLayout previewText="You're in! Here's what to expect from the Virexa newsletter." siteUrl={siteUrl} unsubscribeUrl={unsubscribeUrl}>
      <Section style={{ textAlign: "center" }}>
        <Text style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: BRAND_BLUE, letterSpacing: "0.5px", textTransform: "uppercase" }}>
          🎉 You&apos;re subscribed
        </Text>
        <Heading as="h1" style={{ margin: "0 0 16px", fontSize: 30, lineHeight: "38px", fontWeight: 800, color: "#020617", letterSpacing: "-0.5px" }}>
          Welcome to Virexa
        </Heading>
        <Text style={{ margin: "0 0 28px", fontSize: 15, lineHeight: "24px", color: "#475569", textAlign: "left" }}>
          Thanks for joining. You&apos;ll now get the most important AI, programming, cloud, security, and developer
          news delivered straight to your inbox - curated, concise, and worth your time.
        </Text>
      </Section>

      <Section style={{ backgroundColor: "#f8fafc", borderRadius: 12, padding: "20px 24px", marginBottom: 28, textAlign: "left" }}>
        <Text style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#020617" }}>What you&apos;ll receive:</Text>
        <Text style={{ margin: "0 0 6px", fontSize: 14, lineHeight: "22px", color: "#475569" }}>🤖 Breaking AI &amp; machine learning news</Text>
        <Text style={{ margin: "0 0 6px", fontSize: 14, lineHeight: "22px", color: "#475569" }}>💻 Developer tools, frameworks &amp; releases</Text>
        <Text style={{ margin: "0 0 6px", fontSize: 14, lineHeight: "22px", color: "#475569" }}>☁️ Cloud, infrastructure &amp; security updates</Text>
        <Text style={{ margin: 0, fontSize: 14, lineHeight: "22px", color: "#475569" }}>✨ No spam, no fluff - just what&apos;s worth reading</Text>
      </Section>

      <Section style={{ textAlign: "center", marginBottom: 8 }}>
        <Button
          href={siteUrl}
          style={{
            backgroundColor: BRAND_BLUE,
            borderRadius: 10,
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 700,
            textDecoration: "none",
            textAlign: "center",
            padding: "14px 32px",
            display: "inline-block",
          }}
        >
          Start Reading →
        </Button>
      </Section>

      <Section style={{ textAlign: "center", marginTop: 4 }}>
        <Text style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
          Changed your mind? You can unsubscribe any time from the link at the bottom of this email - no hard
          feelings.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default NewsletterWelcomeEmail;
