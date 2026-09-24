import * as React from "react";

interface TooltipProps {
  tip: string;
  children: React.ReactNode;
}

/** Lightweight tooltip — title fallback, no extra deps for Stage 1. */
export function Tooltip({ tip, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex" title={tip}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs text-white group-hover:block"
      >
        {tip}
      </span>
    </span>
  );
}
