type AuthDividerProps = {
  label?: string;
};

export function AuthDivider({ label = "or continue with" }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
      <span className="text-sm text-slate-500">{label}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
