"use client";

export type TimeFilterOption = {
  id: string;
  label: string;
  count: number;
};

type TimeFilterCardProps = {
  options: TimeFilterOption[];
  selected: string | null;
  onChange: (id: string | null) => void;
};

/**
 * Controlled, presentation-only - all it does is report clicks up to
 * `SearchFiltersPanel`, which owns the actual staged filter state and
 * commits it to the URL on "Apply" (product polishing phase, area 1).
 * Clicking the already-selected option clears it. The previous
 * "Custom Range" date-input block (with a dead, no-op Apply button) has
 * been removed entirely - dead filter code, and redundant with the
 * quick presets below plus the sidebar's own real Apply button.
 */
export function TimeFilterCard({ options, selected, onChange }: TimeFilterCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold tracking-tight text-slate-950">Time</h2>

      <div className="mt-4 space-y-2">
        {options.map((option) => {
          const isSelected = selected === option.id;
          return (
            <label
              key={option.id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="time-filter"
                  checked={isSelected}
                  onChange={() => onChange(isSelected ? null : option.id)}
                  className="size-4 accent-[#2f67e8]"
                />
                <span className="text-base font-medium text-slate-700">{option.label}</span>
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {option.count}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
