"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "What is an OpenRouter key?",
    a: "It is a free code that lets you use AI. Think of it like a library card for robots. We show you how to get one in 2 minutes.",
  },
  {
    q: "Is Control Key really free?",
    a: "Yes. 100% free. You bring your own free key. We never ask for your card. We never sell anything.",
  },
  {
    q: "Will AI ever disobey my locks?",
    a: "No. Your locks are top orders. Even if you beg AI to break them, it will say no and remind you of your lock.",
  },
  {
    q: "What if I am under 13?",
    a: "Ask a parent to help you get the key. Then you can set locks alone. Easy and safe.",
  },
  {
    q: "Where is my key stored?",
    a: "In your own browser only. It never leaves your device unless you choose cloud save. You can delete it anytime.",
  },
  {
    q: "Can I delete my locks and data?",
    a: "Yes. Delete one lock or all data in one click. Your words, your control, always.",
  },
];

/** FAQ accordion — one open at a time, keyboard accessible. */
export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="ck-container ck-section scroll-mt-20 bg-white">
      <h2 className="font-heading text-center text-3xl font-extrabold text-[#111827]">
        Questions? Answers.
      </h2>
      <div className="mx-auto mt-10 max-w-2xl space-y-3">
        {FAQS.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.q} className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-bold text-[#111827]">
                  {item.q}
                </span>
                <ChevronDown
                  size={20}
                  aria-hidden
                  className={cn(
                    "shrink-0 text-[#64748B] transition-transform",
                    open && "rotate-180"
                  )}
                />
              </button>
              {open && (
                <p className="px-5 pb-5 text-sm leading-relaxed text-[#64748B]">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
