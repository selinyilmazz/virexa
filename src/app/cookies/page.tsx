import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Cookie Policy | Virexa",
};

export default function CookiesPage() {
  return (
    <>
      <Header />
      <LegalPageLayout
        title="Cookie Policy"
        description="Last updated July 2026. How Virexa uses cookies and local browser storage."
      >
        <section>
          <h2 className="text-xl font-bold text-slate-950">What Are Cookies</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            Cookies are small text files placed on your device by a website. Similar technologies, such as local
            browser storage, serve related purposes like remembering your settings between visits.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">How We Use Cookies</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            Virexa keeps things simple: rather than relying on tracking cookies, most of your preferences —
            bookmarks, profile details, notification and display settings — are stored directly in your browser&apos;s
            local storage. This keeps your experience consistent without sharing that data with third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Types of Data We Store Locally</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            This includes essential data (your sign-in state and saved articles) and preference data (language,
            summary length, notification choices and category interests). None of this is used for cross-site
            advertising tracking.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Managing Your Data</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            You can clear your saved preferences at any time by clearing your browser&apos;s site data, or by using the
            Delete Account option in your profile settings, which removes all locally stored Virexa data from that
            browser.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Contact Us</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            Questions about this Cookie Policy can be sent to{" "}
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
