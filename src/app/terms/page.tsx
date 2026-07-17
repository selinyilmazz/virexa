import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service | Virexa",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <LegalPageLayout
        title="Terms of Service"
        description="Last updated July 2026. Please read these terms before using Virexa."
      >
        <section>
          <h2 className="text-xl font-bold text-slate-950">Acceptance of Terms</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            By accessing or using Virexa, you agree to be bound by these Terms of Service. If you do not agree with
            any part of these terms, please do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Use of the Service</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            Virexa is provided for personal, non-commercial use to browse and read curated news content. You agree
            not to misuse the service, attempt to disrupt it, or use it in a way that violates any applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Account Responsibilities</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            You are responsible for maintaining the confidentiality of your account credentials and for any activity
            that occurs under your account. Notify us promptly if you suspect unauthorized use.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Content and Intellectual Property</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            Articles and summaries surfaced on Virexa are aggregated from third-party sources, which retain their own
            rights over their original content. The Virexa name, logo and interface design are the property of
            Virexa and may not be reproduced without permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Limitation of Liability</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            Virexa is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental
            or consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Changes to These Terms</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            We may update these Terms of Service from time to time. Continued use of Virexa after changes are posted
            constitutes acceptance of the revised terms.
          </p>
        </section>
      </LegalPageLayout>
    </>
  );
}
