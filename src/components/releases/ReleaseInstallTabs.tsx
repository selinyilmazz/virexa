"use client";

import { useState } from "react";
import type { InstallCommand } from "@/data/releases";

const copyIcon = (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </svg>
);

const checkIcon = (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5 9.5 17 19 7" />
  </svg>
);

/** Installation (requirement 4): a tabbed installer - which tabs make sense varies per technology (npm/pnpm/yarn/bun for a JS library, an OS-installer picker for a runtime/tool) - so this simply renders whatever `TechnologyRelease.install` provides, with a copyable command. */
export function ReleaseInstallTabs({ commands }: { commands: InstallCommand[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const active = commands[activeIndex];

  if (!active) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(active.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable - the command is still fully visible/selectable to copy manually.
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold tracking-tight text-slate-950">Installation</h2>

      <div className="mt-4 flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1.5">
        {commands.map((command, index) => (
          <button
            key={command.label}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              index === activeIndex ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {command.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3.5">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre text-sm text-slate-100">{active.command}</code>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
        >
          {copied ? checkIcon : copyIcon}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
