"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Check, FlaskConical, GripVertical, KeyRound, Pencil, TriangleAlert, Trash2 } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
import { type Rule } from "@/lib/ruleGuard";
import { CategoryIcon } from "@/components/rules/CategoryIcon";
import { cn } from "@/lib/utils";

export type TestState = "idle" | "testing" | "passed" | "slipped" | "needs-key";

/**
 * RuleCard — one lock: Toggle + title + preview + strength badge +
 * category icon + Edit/Delete + priority reorder + Test button.
 */
export function RuleCard({
  rule,
  isFirst,
  isLast,
  testState,
  onToggle,
  onEdit,
  onDelete,
  onMove,
  onTest,
  onDragStart,
  onDrop,
}: {
  rule: Rule;
  isFirst: boolean;
  isLast: boolean;
  testState: TestState;
  onToggle: (on: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onTest: () => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
}) {
  const strict = rule.strength === "strict";
  return (
    <li
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(rule.id)}
      className={cn(
        "rounded-2xl border bg-white p-3 transition dark:bg-slate-900",
        rule.is_enabled
          ? "border-[#E2E8F0] dark:border-slate-700"
          : "border-dashed border-slate-300 opacity-70 dark:border-slate-600"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle (desktop) + priority */}
        <div className="flex flex-col items-center">
          <span
            draggable
            onDragStart={() => onDragStart(rule.id)}
            title="Drag to reorder (top = strongest)"
            aria-label={`Drag ${rule.title} to reorder`}
            className="hidden cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-100 active:cursor-grabbing sm:block dark:hover:bg-slate-800"
          >
            <GripVertical size={16} aria-hidden />
          </span>
          <span
            title={`Priority #${rule.priority} — top is strongest`}
            className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-300"
          >
            {rule.priority}
          </span>
        </div>

        <Toggle checked={rule.is_enabled} onChange={onToggle} label={`Turn ${rule.title} ${rule.is_enabled ? "off" : "on"}`} />

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 font-extrabold text-[#0F172A] dark:text-white">
            <CategoryIcon category={rule.category} />
            <span className="truncate">{rule.title}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                strict ? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-500"
              )}
            >
              {strict ? "Strict" : "Guide"}
            </span>
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{rule.instruction}</p>
          {/* Actions row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${rule.title}`}
              className="flex min-h-[36px] min-w-[36px] items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-[#4F46E5] dark:hover:bg-slate-800"
            >
              <Pencil size={14} aria-hidden /> Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${rule.title}`}
              className="flex min-h-[36px] min-w-[36px] items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
            >
              <Trash2 size={14} aria-hidden /> Delete
            </button>
            <button
              type="button"
              onClick={onTest}
              disabled={testState === "testing"}
              aria-label={`Test lock ${rule.title}`}
              title="Send a hidden probe to check AI obeys this lock"
              className="flex min-h-[36px] items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-500 hover:bg-indigo-50 hover:text-[#4F46E5] disabled:opacity-50 dark:hover:bg-indigo-950"
            >
              <FlaskConical size={14} aria-hidden />
              {testState === "testing" ? (
                "Testing…"
              ) : testState === "passed" ? (
                <span className="flex items-center gap-1">
                  <Check size={14} aria-hidden /> Obeyed
                </span>
              ) : testState === "slipped" ? (
                <span className="flex items-center gap-1">
                  <TriangleAlert size={14} aria-hidden /> Slipped
                </span>
              ) : testState === "needs-key" ? (
                <span className="flex items-center gap-1">
                  <KeyRound size={14} aria-hidden /> Need key
                </span>
              ) : (
                "Test"
              )}
            </button>
            <span className="ml-auto flex gap-0.5" role="group" aria-label="Reorder priority">
              <button
                type="button"
                onClick={() => onMove(-1)}
                disabled={isFirst}
                aria-label={`Move ${rule.title} up (stronger)`}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
              >
                <ArrowUp size={14} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onMove(1)}
                disabled={isLast}
                aria-label={`Move ${rule.title} down (weaker)`}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
              >
                <ArrowDown size={14} aria-hidden />
              </button>
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}
