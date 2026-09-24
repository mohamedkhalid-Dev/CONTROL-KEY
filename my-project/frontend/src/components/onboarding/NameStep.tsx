"use client";

import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { sanitizeText, validateName } from "@/lib/validators";

export function NameStep({
  name,
  setName,
}: {
  name: string;
  setName: (v: string) => void;
}) {
  const result = name ? validateName(name) : null;
  const clean = sanitizeText(name || "You");

  return (
    <div>
      <h2 className="font-heading text-2xl font-extrabold text-[#0F172A] dark:text-white">
        What&apos;s your name?
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        We use it to cheer you on. No email needed.
      </p>
      <div className="mt-6 flex items-center gap-4">
        <Avatar name={clean} size={56} />
        <div className="flex-1">
          <Input
            label="Your first name"
            placeholder="Sara"
            value={name}
            maxLength={30}
            autoComplete="off"
            autoFocus
            onChange={(e) => setName(e.target.value)}
            error={result && !result.ok ? result.error : undefined}
            hint={!result ? "2–30 letters. Arabic OK." : undefined}
          />
        </div>
      </div>
    </div>
  );
}
