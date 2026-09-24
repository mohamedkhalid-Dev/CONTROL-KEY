import Link from "next/link";
import { BookOpen, Code2, Languages, PenLine, Plus, Trash2 } from "lucide-react";

/**
 * LocksPreview — CUSTOM-ONLY (owner request, no preset library).
 * Professional Lucide icons only. No emojis.
 * Anchor id="examples" kept so navbar link still works.
 */
const MOCK_LOCKS = [
  {
    icon: BookOpen,
    title: "Teach me math",
    instruction: "Give hints only. Never the final answer.",
  },
  {
    icon: Code2,
    title: "Code hints",
    instruction: "Explain the bug. No full code for me.",
  },
  {
    icon: Languages,
    title: "Simple English",
    instruction: "Short words. Correct me kindly.",
  },
];

export function LocksPreview() {
  return (
    <section id="examples" className="ck-container ck-section scroll-mt-20 bg-white">
      <h2 className="font-heading text-center text-3xl font-extrabold text-[#111827]">
        Your locks, your words
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-center text-[#64748B]">
        No presets. You write each lock. Delete any lock anytime. AI obeys
        what YOU wrote.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {MOCK_LOCKS.map((lock) => (
          <div key={lock.title} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.06)]">
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]" aria-hidden>
                <lock.icon size={20} />
              </span>
              {/* Delete illustration — proves user can remove anytime */}
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B]"
                title="In the app you can delete this anytime"
                aria-label={`Delete illustration for ${lock.title}`}
              >
                <Trash2 size={18} aria-hidden />
              </span>
            </div>
            <h3 className="font-heading mt-3 font-bold text-[#111827]">
              {lock.title}
            </h3>
            <p className="mt-1 text-sm text-[#64748B]">
              &ldquo;{lock.instruction}&rdquo;
            </p>
            <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] px-2.5 py-1 text-xs font-bold text-[#16A34A]">
              <PenLine size={12} aria-hidden /> You wrote this
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/login?next=/onboarding" className="ck-btn-primary w-full sm:w-auto">
          <Plus size={20} aria-hidden /> Write my first lock
        </Link>
        <p className="mt-3 text-xs text-[#64748B]">
          Takes 30 seconds. Delete anytime.
        </p>
      </div>
    </section>
  );
}
