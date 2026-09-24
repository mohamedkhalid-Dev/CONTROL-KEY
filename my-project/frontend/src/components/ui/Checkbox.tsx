import * as React from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  error?: string;
}

/** Accessible consent checkbox — native input, 44px target, inline error. */
export function Checkbox({ label, error, id, className, ...props }: CheckboxProps) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  return (
    <div className={cn("w-full", className)}>
      <label
        htmlFor={fieldId}
        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-slate-50 px-4 py-3"
      >
        <input
          id={fieldId}
          type="checkbox"
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-err` : undefined}
          className="mt-0.5 h-5 w-5 min-h-[20px] min-w-[20px] shrink-0 cursor-pointer accent-[#2563EB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
          {...props}
        />
        <span className="text-xs leading-relaxed text-slate-600">{label}</span>
      </label>
      {error && (
        <p id={`${fieldId}-err`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-sm text-[#EF4444]">
          <CircleAlert size={14} aria-hidden className="shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
