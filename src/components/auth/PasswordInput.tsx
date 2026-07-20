"use client";

import { useState } from "react";
import { useTranslations } from "@/i18n/i18n-provider";

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
  helperText?: string;
  showStrengthMeter?: boolean;
};

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  helperText,
  showStrengthMeter,
}: PasswordInputProps) {
  const t = useTranslations();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
          </svg>
        </span>
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-12 w-full rounded-xl border bg-slate-50 py-2 pl-11 text-base text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#2f67e8] focus:bg-white ${
            showStrengthMeter ? "pr-24" : "pr-12"
          } ${error ? "border-red-400" : "border-slate-200"}`}
        />

        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
          {showStrengthMeter && (
            <span aria-hidden="true" className="flex items-center gap-1">
              <span className="h-1 w-3 rounded-full bg-slate-200" />
              <span className="h-1 w-3 rounded-full bg-slate-200" />
              <span className="h-1 w-3 rounded-full bg-slate-200" />
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? t("auth.fields.hidePassword") : t("auth.fields.showPassword")}
            className="flex items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              {showPassword ? (
                <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.83 2.83M6.6 6.6C4.5 8 3 10 2.5 12c1.4 4 5 7 9.5 7 1.6 0 3-.3 4.3-.9M17.4 17.4C19.5 16 21 14 21.5 12c-.5-1.5-1.4-3-2.7-4.2" />
              ) : (
                <>
                  <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
      {helperText && !error && <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
