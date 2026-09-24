"use client";

import Image from "next/image";
import { ShieldCheck } from "lucide-react";

/** Professional empty chat — circular logo + 4 suggestion chips. No robot. */

const CHIPS = [
  "Explain photosynthesis with hints only",
  "Quiz me on multiplication tables",
  "Give hints for my essay, don't write it",
  "Explain gravity in simple words",
];

export function ChatEmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 text-center">
      <Image
        src="/logo-circle.svg"
        alt="Control Key logo"
        width={72}
        height={72}
        className="h-[72px] w-[72px] rounded-full object-cover"
      />
      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#F0FDF4] px-3 py-1 text-xs font-bold text-[#16A34A]">
        <ShieldCheck size={14} aria-hidden />
        Protected — locks active
      </div>
      <h2 className="font-heading mt-3 max-w-md text-2xl font-extrabold text-[#111827]">
        Ask me anything — your locks stay on
      </h2>
      <p className="mt-2 max-w-md text-sm text-[#64748B]">
        I teach with hints first. Select a starter below.
      </p>
      <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            className="min-h-[48px] rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-left text-sm font-semibold text-[#111827] transition hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
