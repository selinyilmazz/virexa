import type { Metadata } from "next";
import Link from "next/link";
import { getServerTranslations } from "@/i18n/get-server-translations";
import { unsubscribeSubscriber, type UnsubscribeResult } from "@/services/newsletter/newsletter-service";

export const metadata: Metadata = {
  title: "Unsubscribe | Virexa",
  robots: { index: false, follow: false },
};

type UnsubscribePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toStringParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Human-facing one-click unsubscribe landing page - what the "Unsubscribe"
 * link in `NewsletterWelcomeEmail`'s footer actually points to. The
 * unsubscribe itself happens as a side effect of loading this page (no
 * extra "are you sure?" click) - standard one-click-unsubscribe UX
 * (Substack/Mailchimp/etc. all work this way), and it's the entire reason
 * the link carries a signed `token` rather than just the subscriber `id`:
 * anyone can load this URL, but only the exact link Virexa emailed them
 * carries a token that verifies (see `lib/email/unsubscribe-token.ts`).
 *
 * Distinct from `POST /api/newsletter/unsubscribe`, which exists purely
 * for RFC 8058 one-click unsubscribe (mail clients' own native
 * "Unsubscribe" button next to the sender, via the `List-Unsubscribe`
 * header) - both call the same `unsubscribeSubscriber()` so the actual
 * logic exists once.
 *
 * `noindex` metadata: this URL is only ever meant to be reached from a
 * specific emailed link, never crawled or linked from the site itself.
 */
export default async function NewsletterUnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { t } = await getServerTranslations();
  const params = await searchParams;
  const id = toStringParam(params.id);
  const token = toStringParam(params.token);

  const result: UnsubscribeResult = id && token ? await unsubscribeSubscriber(id, token) : { status: "invalid" };

  const content = (() => {
    switch (result.status) {
      case "unsubscribed":
        return { icon: "✅", title: t("newsletterUnsubscribe.successTitle"), description: t("newsletterUnsubscribe.successDescription") };
      case "already-unsubscribed":
        return { icon: "✅", title: t("newsletterUnsubscribe.alreadyTitle"), description: t("newsletterUnsubscribe.alreadyDescription") };
      case "invalid":
        return { icon: "⚠️", title: t("newsletterUnsubscribe.invalidTitle"), description: t("newsletterUnsubscribe.invalidDescription") };
      case "error":
      default:
        return { icon: "⚠️", title: t("newsletterUnsubscribe.errorTitle"), description: t("newsletterUnsubscribe.errorDescription") };
    }
  })();

  return (
    <main className="flex min-h-screen flex-col bg-[#f8fafc]">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex min-h-24 max-w-[1920px] items-center px-5 py-3 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-[#2f67e8]" aria-label={t("nav.logoAria")}>
            <svg aria-hidden="true" viewBox="0 0 64 56" className="h-10 w-12 sm:h-11 sm:w-13" fill="none">
              <path d="M3 4h16l14 26L47 4h14L38 52H24L3 4Z" fill="currentColor" />
              <path d="m35 18 7-13h13l-8 13H35Z" fill="currentColor" />
              <path d="M48 17h10v10H48zM55 3h7v7h-7z" fill="currentColor" />
            </svg>
            <span className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Virexa</span>
          </Link>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
            {content.icon}
          </span>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">{content.title}</h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">{content.description}</p>
          <Link href="/" className="mt-6 rounded-xl bg-[#2f67e8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2556c9]">
            {t("newsletterUnsubscribe.backToHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
