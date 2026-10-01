import { Users, Layers, ShieldCheck } from "lucide-react";

const ITEMS = [
  { icon: Users, text: "Built for everyone who wants control" },
  { icon: Layers, text: "Works with 100+ OpenRouter models" },
  { icon: ShieldCheck, text: "Your rules, always enforced" },
];

/** Repetition strip — 3 trust signals, same style. Light Mode. */
export function TrustStrip() {
  return (
    <section aria-label="Why trust Control Key" className="border-y border-[#E2E8F0] bg-[#F8FAFC]">
      <div className="ck-container flex flex-col items-center justify-center gap-3 py-6 sm:flex-row sm:gap-8">
        {ITEMS.map((item) => (
          <div key={item.text} className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
            <item.icon size={18} className="text-[#2563EB]" aria-hidden />
            {item.text}
          </div>
        ))}
      </div>
    </section>
  );
}
