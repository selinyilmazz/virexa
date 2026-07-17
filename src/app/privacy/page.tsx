import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | Virexa",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <LegalPageLayout
        title="Privacy Policy"
        description="Last updated July 2026. This page explains what information Virexa handles and how."
      >
        <section>
          <h2 className="text-xl font-bold text-slate-950">Information We Collect</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            When you create an account, we collect the details you provide, such as your name and email address. As
            you use Virexa, we also keep track of your on-device preferences, including saved bookmarks, reading
            settings and category preferences, so the app behaves consistently between visits.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">How We Use Your Information</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            We use your information to operate your account, remember your preferences, and personalize the articles
            and categories you see. We do not sell personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Where Your Data Lives</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            Much of your Virexa experience — including bookmarks, profile details and settings — is stored locally in
            your browser rather than on a remote server. Clearing your browser storage or using a different device
            or browser will reset this information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Your Rights</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            You can review, edit or delete your profile information at any time from your account settings. Deleting
            your account permanently removes your locally stored data, including bookmarks and preferences.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Contact Us</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            If you have questions about this Privacy Policy, contact us at{" "}
            <a href="mailto:hello@virexa.app" className="font-medium text-[#2f67e8] hover:text-[#2556c9]">
              hello@virexa.app
            </a>
            .
          </p>
        </section>
      </LegalPageLayout>
    </>
  );
}
