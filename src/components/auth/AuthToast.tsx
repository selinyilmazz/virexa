type AuthToastProps = {
  message: string;
};

export function AuthToast({ message }: AuthToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-6 z-50 mx-auto flex w-fit max-w-[90vw] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg"
    >
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600"
      >
        ✓
      </span>
      {message}
    </div>
  );
}
