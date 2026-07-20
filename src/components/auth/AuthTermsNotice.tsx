"use client";

import Link from "next/link";
import { useTranslations } from "@/i18n/i18n-provider";

type AuthTermsNoticeProps = {
  /** Translation key for the localized action phrase, e.g. "auth.signIn.termsAction" -> "signing in". */
  actionLabelKey: string;
};

/**
 * Renders `settings.termsNotice`'s "By {action}, you agree to our {terms}
 * and {privacy}" template with the Terms/Privacy portions as real
 * `<Link>`s. Since `t()` only does plain string interpolation
 * (`{key}` -> string, not JSX), `{terms}`/`{privacy}` are deliberately
 * left unsubstituted by `t()` (no matching `values` entry) and then
 * split out of the resulting string here so they can be replaced with
 * actual links - the same literal placeholder tokens exist in every
 * locale file, so this works regardless of the active language.
 */
export function AuthTermsNotice({ actionLabelKey }: AuthTermsNoticeProps) {
  const t = useTranslations();
  const template = t("auth.termsNotice", { action: t(actionLabelKey) });
  const [beforeTerms, afterTerms] = template.split("{terms}");
  const [betweenTermsAndPrivacy, afterPrivacy] = (afterTerms ?? "").split("{privacy}");

  return (
    <p className="mt-8 flex flex-wrap items-center justify-center gap-x-1 text-center text-xs text-slate-400">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-1 size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2 4 5v6c0 5 3.4 8.9 8 11 4.6-2.1 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
      </svg>
      {beforeTerms}
      <Link href="/terms" className="font-medium text-[#2f67e8] hover:text-[#2556c9]">
        {t("auth.termsOfService")}
      </Link>
      {betweenTermsAndPrivacy}
      <Link href="/privacy" className="font-medium text-[#2f67e8] hover:text-[#2556c9]">
        {t("auth.privacyPolicy")}
      </Link>
      {afterPrivacy}
    </p>
  );
}
