"use client";

import Link from "next/link";
import { ChevronDown, Eye, EyeOff } from "lucide-react";

/** Collapsed 4-step mini guide — full version lives at /guide/get-key. */
export function KeyGuide({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  return (
    <div className="mt-3 rounded-2xl border border-[#E2E8F0] bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex min-h-[48px] w-full items-center justify-between px-4 py-3 text-sm font-bold text-[#4F46E5]"
      >
        Where&apos;s my key? Get one in 2 min
        <ChevronDown size={18} aria-hidden className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <ol className="list-decimal space-y-2 px-8 pb-4 text-sm text-slate-700 dark:text-slate-200">
          <li>
            Go to{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#4F46E5] underline"
            >
              openrouter.ai/keys
            </a>{" "}
            and make a free account.
          </li>
          <li>Click Create Key. Give it any name.</li>
          <li>Copy the key. It starts with sk-or-.</li>
          <li>Paste it above. Free models may need $0 credit.</li>
          <li>
            Need pictures?{" "}
            <Link href="/guide/get-key" className="font-bold text-[#4F46E5] underline">
              Open full guide →
            </Link>
          </li>
        </ol>
      )}
    </div>
  );
}

export function EyeButton({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Hide key" : "Show key"}
      className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {show ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  );
}
