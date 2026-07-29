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
  // Defensive fallback: guarantees this can never throw during render even
  // if `variant` is ever something other than the three known values (e.g.
  // a future caller passes something unexpected) - previously an invalid
  // `variant` would destructure `undefined` and throw mid-render, which
  // React (with no `error.tsx` in this app - see NewsletterSection audit)
  // would surface as a generic/blank error page rather than a toast.
  const { badgeClass, icon } = VARIANT_STYLES[variant] ?? VARIANT_STYLES.success;

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
