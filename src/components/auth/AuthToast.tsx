export type AuthToastVariant = "success" | "error" | "info";

type AuthToastProps = {
  message: string;
  variant?: AuthToastVariant;
};

const VARIANT_STYLES: Record<AuthToastVariant, { badgeClass: string; icon: string }> = {
  success: { badgeClass: "bg-green-100 text-green-600", icon: "✓" },
  error: { badgeClass: "bg-red-100 text-red-600", icon: "!" },
  info: { badgeClass: "bg-blue-100 text-[#2f67e8]", icon: "i" },
};

export function AuthToast({ message, variant = "success" }: AuthToastProps) {
  const { badgeClass, icon } = VARIANT_STYLES[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-6 z-50 mx-auto flex w-fit max-w-[90vw] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg"
    >
      <span
        aria-hidden="true"
        className={`flex size-6 shrink-0 items-center justify-center rounded-full ${badgeClass}`}
      >
        {icon}
      </span>
      {message}
    </div>
  );
}
