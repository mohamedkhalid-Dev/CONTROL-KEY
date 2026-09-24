"use client";

import * as React from "react";
import { Check, Compass, ScanEye, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/rules/CategoryIcon";
import { validateRule } from "@/lib/validators";
import {
  CATEGORIES,
  findDuplicate,
  type Rule,
  type RuleCategory,
  type RuleStrength,
} from "@/lib/ruleGuard";

export interface RuleFormValue {
  title: string;
  instruction: string;
  strength: RuleStrength;
  category: RuleCategory;
}

/**
 * RuleModal — Add / Edit lock (custom-first: blank fields, student is author).
 * Title + Instruction (10–500 counter) + Strict/Guide + Category +
 * live "How AI will read this" preview + duplicate Merge/Keep/Cancel.
 */
export function RuleModal({
  open,
  initial,
  editing,
  existingRules,
  onClose,
  onSave,
  onMerge,
}: {
  open: boolean;
  /** Prefill (blank for new, idea text for "use idea", rule for edit). */
  initial: RuleFormValue;
  editing: Rule | null;
  existingRules: Rule[];
  onClose: () => void;
  onSave: (v: RuleFormValue) => void;
  onMerge: (target: Rule, v: RuleFormValue) => void;
}) {
  const [title, setTitle] = React.useState(initial.title);
  const [instruction, setInstruction] = React.useState(initial.instruction);
  const [strength, setStrength] = React.useState<RuleStrength>(initial.strength);
  const [category, setCategory] = React.useState<RuleCategory>(initial.category);
  const [error, setError] = React.useState<string | undefined>();
  const [dup, setDup] = React.useState<Rule | null>(null);

  // Reset when opened with new initial (idea / edit / blank)
  React.useEffect(() => {
    if (open) {
      setTitle(initial.title);
      setInstruction(initial.instruction);
      setStrength(initial.strength);
      setCategory(initial.category);
      setError(undefined);
      setDup(null);
    }
  }, [open, initial]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const check = validateRule(title, instruction);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    const value: RuleFormValue = {
      title: title.trim(),
      instruction: instruction.trim(),
      strength,
      category,
    };
    // Duplicate check (Error Matrix #10) — skip when editing same rule unchanged
    const found = findDuplicate(value, existingRules, editing?.id);
    if (found && !dup) {
      setDup(found);
      return;
    }
    setError(undefined);
    onSave(value);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit lock" : "New lock"}
      wide
    >
      {dup ? (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <p className="text-sm font-extrabold">You already have “{dup.title}”.</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            It sounds almost the same. Merge them into one stronger lock, keep both, or go back and edit?
          </p>
          <div className="mt-4 space-y-2">
            <Button className="w-full" onClick={() => onMerge(dup, { title: title.trim(), instruction: instruction.trim(), strength, category })}>
              Merge into one
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setDup(null);
                onSave({ title: title.trim(), instruction: instruction.trim(), strength, category });
              }}
            >
              Keep both
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setDup(null)}>
              Cancel — keep editing
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {/* Intro */}
          <p className="-mt-1 text-sm text-slate-500">
            {editing
              ? "Update the wording — AI follows the new version right away."
              : "Write it in your own words — AI cannot cross what you save here."}
          </p>

          {/* 1 — Title */}
          <section aria-labelledby="rule-title-heading" className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-[#4F46E5] dark:bg-indigo-950">
                1
              </span>
              <h3 id="rule-title-heading" className="text-sm font-extrabold">
                Name your lock
              </h3>
            </div>
            <p className="mb-3 mt-1 pl-8 text-xs text-slate-500">
              A short name you’ll recognize in My Locks.
            </p>
            <div className="pl-0 sm:pl-8">
              <Input
                label="Lock title"
                placeholder="e.g. Don't solve my math"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                hint="3–80 letters. Example: “Quiz me before explaining”."
                error={error && title.trim().length < 3 ? error : undefined}
              />
            </div>
          </section>

          {/* 2 — Instruction */}
          <section aria-labelledby="rule-instruction-heading" className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-[#4F46E5] dark:bg-indigo-950">
                2
              </span>
              <h3 id="rule-instruction-heading" className="text-sm font-extrabold">
                What must AI do?
              </h3>
            </div>
            <p className="mb-3 mt-1 pl-8 text-xs text-slate-500">
              One clear instruction. Short rules work best.
            </p>
            <div className="pl-0 sm:pl-8">
              <Textarea
                label="Instruction"
                placeholder="e.g. Never give final answer. Give 3 hints then ask me to try."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value.slice(0, 500))}
                maxLength={500}
                error={error && title.trim().length >= 3 ? error : undefined}
              />
            </div>
          </section>

          {/* 3 — Strength */}
          <section aria-labelledby="rule-strength-heading" className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-[#4F46E5] dark:bg-indigo-950">
                3
              </span>
              <h3 id="rule-strength-heading" className="text-sm font-extrabold">
                How strict?
              </h3>
            </div>
            <p className="mb-3 mt-1 pl-8 text-xs text-slate-500">
              Strict = AI never breaks it. Guide = AI tries to follow it.
            </p>
            <div className="grid grid-cols-1 gap-2 pl-0 sm:grid-cols-2 sm:pl-8" role="radiogroup" aria-label="Lock strength">
              {(
                [
                  { v: "strict", label: "Strict", hint: "Never break, even if asked.", Icon: ShieldCheck },
                  { v: "guide", label: "Guide", hint: "Follow when possible.", Icon: Compass },
                ] as const
              ).map((o) => {
                const selected = strength === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setStrength(o.v)}
                    className={`relative flex min-h-[68px] items-start gap-3 rounded-2xl border-2 px-3 py-3 text-left transition ${
                      selected
                        ? "border-[#4F46E5] bg-indigo-50/70 dark:bg-indigo-950"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        selected ? "bg-[#4F46E5] text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}
                    >
                      <o.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold">{o.label}</span>
                      <span className="block text-xs text-slate-500">{o.hint}</span>
                    </span>
                    {selected && (
                      <span aria-hidden className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#4F46E5] text-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4 — Category */}
          <section aria-labelledby="rule-category-heading" className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-[#4F46E5] dark:bg-indigo-950">
                4
              </span>
              <h3 id="rule-category-heading" className="text-sm font-extrabold">
                Category
              </h3>
            </div>
            <p className="mb-3 mt-1 pl-8 text-xs text-slate-500">
              Helps you find it later. Doesn’t change how AI obeys it.
            </p>
            <div className="flex flex-wrap gap-1.5 pl-0 sm:pl-8" role="radiogroup" aria-label="Lock category">
              {CATEGORIES.map((c) => {
                const selected = category === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setCategory(c.name)}
                    className={`flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition ${
                      selected
                        ? "border-[#4F46E5] bg-indigo-50 text-[#4F46E5] dark:bg-indigo-950"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <CategoryIcon category={c.name} size={14} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Live preview — "How AI will read this" */}
          <div className="rounded-2xl border-l-4 border-[#4F46E5] bg-slate-50 p-4 dark:bg-slate-800">
            <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              <ScanEye size={14} aria-hidden />
              How AI will read this
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              <span className="mr-1.5 inline-block rounded-md bg-slate-900 px-1.5 py-0.5 align-middle text-[10px] font-extrabold tracking-wide text-white dark:bg-white dark:text-slate-900">
                {strength.toUpperCase()}
              </span>
              <strong>{title.trim() || "Your title"}</strong>
              <span className="text-slate-400"> · {category}</span>
              <span className="mt-0.5 block text-slate-600 dark:text-slate-300">
                {instruction.trim() || "Your instruction will appear here…"}
              </span>
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row dark:border-slate-800">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editing ? "Save changes" : "Create lock"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
