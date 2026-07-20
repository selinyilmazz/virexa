"use client";

import { useTranslations } from "@/i18n/i18n-provider";

type SocialLoginButtonsProps = {
  onGoogleClick: () => void;
  disabled?: boolean;
};

export function SocialLoginButtons({ onGoogleClick, disabled }: SocialLoginButtonsProps) {
  const t = useTranslations();
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onGoogleClick}
        disabled={disabled}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
          <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.6c2.1-2 3.2-4.8 3.2-8Z" />
          <path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.3v2.8C4.1 20.6 7.8 23 12 23Z" />
          <path fill="#FBBC05" d="M6 14.3c-.2-.7-.4-1.4-.4-2.3s.1-1.6.4-2.3V6.9H2.3C1.5 8.5 1 10.2 1 12s.5 3.5 1.3 5.1L6 14.3Z" />
          <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.3 1.6l3.2-3.2C17.4 2 15 1 12 1 7.8 1 4.1 3.4 2.3 6.9L6 9.7c.9-2.5 3.2-4.3 6-4.3Z" />
        </svg>
        {t("auth.google")}
      </button>
    </div>
  );
}
