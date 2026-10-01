"use client";

import * as React from "react";
import { Lightbulb } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { CATEGORIES, STARTER_IDEAS, type StarterIdea } from "@/lib/ruleGuard";
import { CategoryIcon } from "@/components/rules/CategoryIcon";

/**
 * TemplateGallery — "Need ideas?" (custom-only safe).
 * The 13 ideas are INSPIRATION: tapping one only pre-fills the New-lock
 * form. Nothing is saved until review + confirm — every
 * stored lock stays origin='custom', authored by the user.
 */
export function TemplateGallery({
  open,
  onClose,
  onUseIdea,
  studentAge,
}: {
  open: boolean;
  onClose: () => void;
  onUseIdea: (idea: StarterIdea) => void;
  studentAge: number;
}) {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState<string>("All");
  const [ageBand, setAgeBand] = React.useState<"all" | "10-14" | "15-20">("all");

  const filtered = STARTER_IDEAS.filter((t) => {
    if (cat !== "All" && t.category !== cat) return false;
    if (ageBand === "10-14" && !(t.ageMin <= 14 && t.ageMax >= 10)) return false;
    if (ageBand === "15-20" && !(t.ageMin <= 20 && t.ageMax >= 15)) return false;
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return `${t.title} ${t.instruction}`.toLowerCase().includes(query);
  });

  return (
    <Modal open={open} onClose={onClose} title="Need ideas?" wide>
      <p className="text-sm text-slate-500">
        These are <strong>starting points, not rules</strong>. Pick one → edit the words → it becomes{" "}
        <strong>YOUR lock</strong>. For age {Number.isFinite(studentAge) ? studentAge : "—"}.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Input label="Search ideas" placeholder="e.g. homework, code…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            aria-label="Filter by category"
            className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="All">All</option>
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={ageBand}
            onChange={(e) => setAgeBand(e.target.value as typeof ageBand)}
            aria-label="Filter by age group"
            className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="all">All ages</option>
            <option value="10-14">10–14</option>
            <option value="15-20">15–20</option>
          </select>
        </div>
      </div>
      <ul className="mt-3 max-h-[40vh] space-y-2 overflow-y-auto pr-1">
        {filtered.map((t) => (
          <li key={t.title} className="rounded-2xl border border-[#E2E8F0] p-3 dark:border-slate-700">
            <p className="flex items-center gap-1.5 text-sm font-extrabold">
              <CategoryIcon category={t.category} /> {t.title}{" "}
              <span className="text-[10px] font-extrabold text-slate-400">
                {t.strength === "strict" ? "Strict" : "Guide"} · {t.ageMin}–{t.ageMax}
              </span>
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{t.instruction}</p>
            <button
              type="button"
              onClick={() => onUseIdea(t)}
              aria-label={`Use idea ${t.title} as starting point`}
              className="mt-2 min-h-[40px] rounded-xl bg-indigo-50 px-4 text-xs font-extrabold text-[#4F46E5] hover:bg-indigo-100"
            >
              Use this idea
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-500">
            <Lightbulb size={18} aria-hidden className="text-slate-400" />
            No ideas match — write your own from scratch.
          </li>
        )}
      </ul>
    </Modal>
  );
}
