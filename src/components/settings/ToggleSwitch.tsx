type ToggleSwitchProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ToggleSwitch({ label, description, checked, onChange }: ToggleSwitchProps) {
  return (
    <label className="flex items-center justify-between gap-4 py-3">
      <span>
        <span className="block font-medium text-slate-950 dark:text-white">{label}</span>
        {description && <span className="block text-sm text-slate-500 dark:text-slate-400">{description}</span>}
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-slate-200 transition-colors peer-checked:bg-[#2f67e8]" />
        <span className="absolute left-1 size-4 rounded-full bg-white dark:bg-slate-900 shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
