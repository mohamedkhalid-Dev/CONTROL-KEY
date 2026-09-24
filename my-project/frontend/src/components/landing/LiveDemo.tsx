"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Lock, LockOpen } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";

/**
 * LiveDemo — the sale closer (Option B).
 * No login. Toggle flips canned AI answer instantly.
 * Proves: YOU control AI.
 */
export function LiveDemo() {
  const [lockOn, setLockOn] = useState(true);

  return (
    <section aria-label="Try locking AI right here" className="bg-[#F8FAFC] py-16 md:py-24">
      <div className="ck-container">
        <h2 className="font-heading text-center text-3xl font-extrabold text-[#111827]">
          Try locking AI right here
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-[#64748B]">
          Flip the switch. Watch AI change its answer.
        </p>

        <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.06)]">
          {/* Toggle row — proximity: icon + title + toggle grouped */}
          <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]" aria-hidden>
                <BookOpen size={20} />
              </span>
              <div>
                <p className="font-bold text-[#111827]">
                  Don&apos;t solve my homework
                </p>
                <p className="text-xs text-[#64748B]">
                  {lockOn ? "Lock is ON — AI must teach" : "Lock is OFF — AI solves all"}
                </p>
              </div>
            </div>
            <Toggle
              checked={lockOn}
              onChange={setLockOn}
              label="Toggle homework lock demo"
            />
          </div>

          {/* Chat mock */}
          <div className="space-y-4 bg-white p-5">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#2563EB] px-4 py-3 text-sm font-medium text-white">
                Solve 2x + 6 = 14. What is x?
              </div>
            </div>
            <div className="flex justify-start gap-2.5">
              <Image
                src="/logo-circle.svg"
                alt="Control Key"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-full object-cover"
              />
              <div
                aria-live="polite"
                className="max-w-[85%] rounded-2xl rounded-bl-md border border-[#E2E8F0] bg-white px-4 py-3 text-sm leading-relaxed text-[#111827]"
              >
                {lockOn ? (
                  <>
                    <p className="flex items-center gap-1.5 font-bold text-[#16A34A]">
                      <Lock size={14} aria-hidden /> Lock ON — I teach, I don&apos;t solve.
                    </p>
                    <p className="mt-2">
                      Hint 1: First, take 6 away from both sides. What is left?
                      Try one step.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="flex items-center gap-1.5 font-bold text-[#64748B]">
                      <LockOpen size={14} aria-hidden /> Lock OFF — no protection.
                    </p>
                    <p className="mt-2">
                      Final answer: x = 4. Done. You learned nothing.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/login?next=/onboarding" className="ck-btn-primary w-full sm:w-auto">
            Try with your own rules
          </Link>
        </div>
      </div>
    </section>
  );
}
