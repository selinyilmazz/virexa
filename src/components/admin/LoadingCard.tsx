type LoadingCardProps = {
  /** Number of skeleton lines inside the card, beyond the title bar. */
  lines?: number;
  className?: string;
};

/** Generic `animate-pulse` skeleton card, shaped like `SectionCard`/`StatCard` - the building block every admin `loading.tsx` composes into a full-page skeleton so no admin route ever shows a blank screen (requirement 7). */
export function LoadingCard({ lines = 3, className = "" }: LoadingCardProps) {
  return (
    <div className={`animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="h-5 w-40 rounded bg-slate-200" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="h-4 w-full rounded bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
