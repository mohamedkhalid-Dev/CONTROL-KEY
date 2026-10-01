import { KeyRound, Lock, MessagesSquare } from "lucide-react";

const STEPS = [
  {
    icon: KeyRound,
    step: "Step 1",
    title: "Get a free key",
    text: "Takes 2 minutes. We show you how.",
  },
  {
    icon: Lock,
    step: "Step 2",
    title: "Write your locks",
    text: "Example: “Quiz me, don’t solve.”",
  },
  {
    icon: MessagesSquare,
    step: "Step 3",
    title: "Chat on your terms",
    text: "AI follows your rules. It never crosses them.",
  },
];

/** How it works — 3 cards, same shape (rhythm). Light Mode professional. */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="ck-container ck-section scroll-mt-20 bg-white">
      <h2 className="font-heading text-center text-3xl font-extrabold text-[#111827]">
        How it works
      </h2>
      <p className="mx-auto mt-3 max-w-md text-center text-[#64748B]">
        Three steps. No tech skills needed.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.title} className="ck-card p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
              <s.icon size={24} aria-hidden />
            </span>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#2563EB]">
              {s.step}
            </p>
            <h3 className="font-heading mt-1 text-lg font-bold text-[#111827]">
              {s.title}
            </h3>
            <p className="mt-2 text-sm text-[#64748B]">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
