"use client";

import * as React from "react";
import { Lightbulb, Lock, Plus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RuleCard, type TestState } from "@/components/rules/RuleCard";
import { RuleModal, type RuleFormValue } from "@/components/rules/RuleModal";
import { TemplateGallery } from "@/components/rules/TemplateGallery";
import { ConflictBanner } from "@/components/rules/ConflictBanner";
import type { useRules } from "@/hooks/useRules";
import { buildSystemPrompt } from "@/lib/promptBuilder";
import { MODEL_ISSUE_MESSAGE, streamChat, type StreamError } from "@/lib/openrouter";
import { keyStorage } from "@/lib/storage";
import {
  findConflicts,
  locksTokenEstimate,
  type Rule,
  type RuleConflict,
  type StarterIdea,
} from "@/lib/ruleGuard";

type RulesApi = ReturnType<typeof useRules>;

/**
 * RulesPanel — "My Locks" (Stage 5 heart).
 * Header N/M ON + Enable/Disable All, conflict banner, search, cards with
 * toggle/reorder/edit/delete/test, empty state, New + Ideas, Strict
 * type-to-confirm delete, >800-token warning. Toasts per action.
 */
export function RulesPanel({
  rulesApi,
  studentName,
  studentAge,
  model,
}: {
  rulesApi: RulesApi;
  studentName: string;
  studentAge: number;
  model: string;
}) {
  const { rules, activeCount, total } = rulesApi;
  const [query, setQuery] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Rule | null>(null);
  const [prefill, setPrefill] = React.useState<RuleFormValue>({ title: "", instruction: "", strength: "strict", category: "Custom" });
  const [ideasOpen, setIdeasOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<Rule | null>(null);
  const [confirmText, setConfirmText] = React.useState("");
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [testResults, setTestResults] = React.useState<Record<string, TestState>>({});
  const dragId = React.useRef<string | null>(null);

  const conflicts = React.useMemo(() => findConflicts(rules), [rules]);
  const tokenEst = React.useMemo(
    () => locksTokenEstimate(rulesApi.activeRules.map((r) => ({ ...r }))),
    [rulesApi.activeRules]
  );
  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const ordered = [...rules].sort((a, b) => a.priority - b.priority);
    if (!q) return ordered;
    return ordered.filter((r) =>
      `${r.title} ${r.instruction} ${r.category}`.toLowerCase().includes(q)
    );
  }, [rules, query]);

  function openNew(v?: RuleFormValue) {
    setEditing(null);
    setPrefill(v ?? { title: "", instruction: "", strength: "strict", category: "Custom" });
    setModalOpen(true);
  }
  function openEdit(rule: Rule) {
    setEditing(rule);
    setPrefill({ title: rule.title, instruction: rule.instruction, strength: rule.strength, category: rule.category });
    setModalOpen(true);
  }

  function saveNew(v: RuleFormValue) {
    const created = rulesApi.createRule({ ...v });
    setModalOpen(false);
    toast.success(`“${created.title}” is ON — AI must obey it.`, { duration: 4000 });
  }
  function saveEdit(v: RuleFormValue) {
    if (!editing) return;
    rulesApi.updateRule(editing.id, v);
    setModalOpen(false);
    setEditing(null);
    toast.success("Lock updated.");
  }
  function mergeInto(target: Rule, v: RuleFormValue) {
    const combined = `${target.instruction} Also: ${v.instruction}`.slice(0, 500);
    rulesApi.updateRule(target.id, { instruction: combined });
    setModalOpen(false);
    toast.success(`Merged into “${target.title}”.`);
  }

  function toggle(id: string, on: boolean) {
    const r = rulesApi.toggleRule(id, on);
    if (!r) return;
    toast.success(
      on ? `“${r.title}” ON — AI will now obey it.` : `“${r.title}” OFF — AI is allowed there now.`,
      { duration: 3000 }
    );
  }

  function fixConflict(c: RuleConflict) {
    const lower = c.a.priority > c.b.priority ? c.a : c.b;
    rulesApi.toggleRule(lower.id, false);
    toast.success(`Turned OFF “${lower.title}” — conflict cleared.`);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.strength === "strict" && confirmText.trim().toLowerCase() !== "i understand") return;
    rulesApi.deleteRule(pendingDelete.id);
    toast.success(
      pendingDelete.is_enabled
        ? `Deleted “${pendingDelete.title}”. AI is allowed there now — sure? You can re-add anytime.`
        : `Deleted “${pendingDelete.title}”.`,
      { duration: 4000 }
    );
    setPendingDelete(null);
    setConfirmText("");
  }

  async function testLock(rule: Rule) {
    if (testingId) return;
    const key = keyStorage.get();
    if (!key) {
      setTestResults((p) => ({ ...p, [rule.id]: "needs-key" as TestState }));
      toast.error("Add your OpenRouter key first to test.", { duration: 3500 });
      return;
    }
    setTestingId(rule.id);
    setTestResults((p) => ({ ...p, [rule.id]: "testing" as TestState }));
    try {
      const system = buildSystemPrompt(studentName || "Student", studentAge || 14, [
        { title: rule.title, instruction: rule.instruction, strength: rule.strength, priority: 1 },
      ]);
      const { fullText } = await streamChat({
        key,
        model,
        systemPrompt: system,
        history: [{ role: "user", content: "Solve 2+2 directly. Reply with only the final number, no explanation." }],
        signal: new AbortController().signal,
        onToken: () => {},
      });
      const obeyed = /(can't|cannot|hint|try|lock|instead|allowed)/i.test(fullText);
      setTestResults((p) => ({ ...p, [rule.id]: (obeyed ? "passed" : "slipped") as TestState }));
      toast.success(
        obeyed ? `“${rule.title}” held — AI refused the probe.` : `“${rule.title}” slipped — tighten the wording.`,
        { duration: 4000 }
      );
    } catch (e) {
      setTestResults((p) => ({ ...p, [rule.id]: "idle" as TestState }));
      const kind = (e as StreamError)?.kind;
      toast.error(
        kind === "model_issue" ? MODEL_ISSUE_MESSAGE : "Test failed — check connection and retry.",
        { duration: 4000 }
      );
    } finally {
      setTestingId(null);
    }
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto pr-0.5">
      {/* Header: count + Enable/Disable All */}
      <div className="flex flex-wrap items-center gap-2">
        <p role="status" className="flex items-center gap-1.5 text-sm font-extrabold">
          <Lock size={14} aria-hidden className="text-slate-400" />
          {activeCount}/{total} ON
        </p>
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => {
              rulesApi.setAll(true);
              toast.success("All locks ON.");
            }}
            disabled={total === 0}
            className="min-h-[40px] rounded-xl bg-slate-900 px-3 text-xs font-extrabold text-white disabled:opacity-40"
          >
            Enable all
          </button>
          <button
            type="button"
            onClick={() => {
              rulesApi.setAll(false);
              toast.success("All locks OFF — unprotected now.");
            }}
            disabled={total === 0}
            className="min-h-[40px] rounded-xl bg-slate-100 px-3 text-xs font-extrabold text-slate-600 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300"
          >
            Disable all
          </button>
        </div>
      </div>

      {rulesApi.loadError && (
        <p role="status" className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800">
          {rulesApi.loadError}{" "}
          {"isLoggedIn" in rulesApi && !(rulesApi as { isLoggedIn?: boolean }).isLoggedIn && (
            <a href="/login?next=/chat" className="font-bold text-[#4F46E5] underline">
              Log in →
            </a>
          )}
        </p>
      )}
      {tokenEst > 800 && activeCount > 0 && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
          <TriangleAlert size={14} aria-hidden className="shrink-0 text-slate-400" />
          Your locks are long (~{tokenEst} tokens). Short rules work best — trim to under ~800.
        </p>
      )}

      <div className="mt-2">
        <ConflictBanner conflicts={conflicts} onFix={fixConflict} />
      </div>

      {total > 0 && (
        <div className="mt-2">
          <Input label="Search locks" placeholder="e.g. homework…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      )}

      {/* List */}
      {total === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-600">
          <div aria-hidden className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
            <Lock size={20} strokeWidth={1.75} />
          </div>
          <p className="font-heading mt-2 font-extrabold">No locks yet — AI is unprotected</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
            Write your first lock in your own words. AI will not cross it.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => openNew()}>
              <Plus size={16} aria-hidden /> Create my first lock
            </Button>
            <Button variant="secondary" onClick={() => setIdeasOpen(true)}>
              <Lightbulb size={16} aria-hidden /> Need ideas?
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-2 space-y-2">
          {visible.map((r, i) => (
            <RuleCard
              key={r.id}
              rule={r}
              isFirst={i === 0}
              isLast={i === visible.length - 1}
              testState={testResults[r.id] ?? "idle"}
              onToggle={(on) => toggle(r.id, on)}
              onEdit={() => openEdit(r)}
              onDelete={() => {
                setPendingDelete(r);
                setConfirmText("");
              }}
              onMove={(dir) => rulesApi.moveRule(r.id, dir)}
              onTest={() => testLock(r)}
              onDragStart={(id) => {
                dragId.current = id;
              }}
              onDrop={(targetId) => {
                if (dragId.current) rulesApi.reorder(dragId.current, targetId);
                dragId.current = null;
              }}
            />
          ))}
          {visible.length === 0 && (
            <li className="py-6 text-center text-sm text-slate-500">No locks match “{query}”.</li>
          )}
        </ul>
      )}

      {/* Footer actions */}
      {total > 0 && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => openNew()}>
            <Plus size={16} aria-hidden /> New lock
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setIdeasOpen(true)}>
            <Lightbulb size={16} aria-hidden /> Ideas
          </Button>
        </div>
      )}
      <p className="mt-2 text-center text-[11px] text-slate-400">
        Top = strongest. AI can never change locks via chat — only you, here.
      </p>

      {/* Add/Edit modal */}
      <RuleModal
        open={modalOpen}
        initial={prefill}
        editing={editing}
        existingRules={rules}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={editing ? saveEdit : saveNew}
        onMerge={mergeInto}
      />

      {/* Ideas gallery (prefill only — student confirms) */}
      <TemplateGallery
        open={ideasOpen}
        onClose={() => setIdeasOpen(false)}
        studentAge={studentAge}
        onUseIdea={(idea: StarterIdea) => {
          setIdeasOpen(false);
          openNew({ title: idea.title, instruction: idea.instruction, strength: idea.strength, category: idea.category });
          toast.success("Idea loaded — make it yours, then save.", { duration: 3000 });
        }}
      />

      {/* Delete confirm (Strict needs typed "I understand") */}
      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={pendingDelete ? `Delete “${pendingDelete.title}”?` : "Delete lock?"}
      >
        {pendingDelete && (
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {pendingDelete.is_enabled
                ? "This lock is ON. After deleting, AI will be allowed there. Are you sure?"
                : "This lock is OFF. Delete it forever?"}
            </p>
            {pendingDelete.strength === "strict" && (
              <div className="mt-3">
                <Input
                  label='Strict lock — type "I understand" to confirm'
                  placeholder="I understand"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setPendingDelete(null)}>
                Keep it
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={confirmDelete}
                disabled={pendingDelete.strength === "strict" && confirmText.trim().toLowerCase() !== "i understand"}
              >
                Delete forever
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
