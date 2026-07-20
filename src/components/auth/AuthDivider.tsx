"use client";

import { useTranslations } from "@/i18n/i18n-provider";

export function AuthDivider() {
  const t = useTranslations();
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
      <span className="text-sm text-slate-500">{t("auth.divider")}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
