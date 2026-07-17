"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getTimeFilterOptions } from "@/data/search";

export function TimeFilterCard() {
  const options = getTimeFilterOptions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTime = searchParams.get("time") ?? "";

  function selectTime(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("time", id);
    router.push(`/search?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold tracking-tight text-slate-950">Time Filter</h2>

      <div className="mt-4 space-y-2">
        {options.map((option) => {
          const isSelected = selectedTime === option.id;
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                isSelected ? "border-[#2f67e8] bg-blue-50/40" : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="time-filter"
                  checked={isSelected}
                  onChange={() => selectTime(option.id)}
                  className="size-4 accent-[#2f67e8]"
                />
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 shrink-0 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                </svg>
                <span className="text-base font-medium text-slate-700">{option.label}</span>
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {option.count}
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between text-base font-semibold text-slate-950">
          Custom Range
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m6 15 6-6 6 6" />
          </svg>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="filter-start-date" className="text-xs font-medium text-slate-500">
              Start Date
            </label>
            <input
              id="filter-start-date"
              type="date"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>
          <div>
            <label htmlFor="filter-end-date" className="text-xs font-medium text-slate-500">
              End Date
            </label>
            <input
              id="filter-end-date"
              type="date"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>
        </div>

        <button
          type="button"
          className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-[#2f67e8] text-sm font-semibold text-white transition-colors hover:bg-[#2556c9]"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
