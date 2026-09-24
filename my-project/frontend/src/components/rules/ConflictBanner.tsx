"use client";

import { TriangleAlert } from "lucide-react";
import type { RuleConflict } from "@/lib/ruleGuard";

/**
 * ConflictBanner — Error Matrix #11.
 * Warns when two ON locks pull opposite ways; highest priority (top) wins.
 */
export function ConflictBanner({
  conflicts,
  onFix,
}: {
  conflicts: RuleConflict[];
  onFix: (c: RuleConflict) => void;
}) {
  if (conflicts.length === 0) return null;
  const c = conflicts[0];
  const lower = c.a.priority > c.b.priority ? c.a : c.b;
  return (
    <div
      role="alert"
      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
    >
      <p className="flex items-center gap-1.5 font-extrabold">
        <TriangleAlert size={16} aria-hidden className="shrink-0 text-slate-400" />
        These locks disagree about “{c.keyword}”:
      </p>
      <p className="mt-1">
        “{c.a.title}” vs “{c.b.title}”. Highest priority wins (#{Math.min(c.a.priority, c.b.priority)}).
        {conflicts.length > 1 && ` +${conflicts.length - 1} more.`}
      </p>
      <button
        type="button"
        onClick={() => onFix(c)}
        aria-label={`Turn off lower priority lock ${lower.title}`}
        className="mt-2 min-h-[40px] rounded-xl bg-slate-900 px-4 text-xs font-extrabold text-white"
      >
        Fix: turn off “{lower.title.slice(0, 24)}”
      </button>
    </div>
  );
}
