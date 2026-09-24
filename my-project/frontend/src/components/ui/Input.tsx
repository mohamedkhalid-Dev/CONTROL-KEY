import * as React from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/** Accessible input — 44px+ tap target, inline error (never alert()). */
export function Input({ label, error, hint, id, className, ...props }: InputProps) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-sm font-bold text-slate-900 dark:text-white"
        >
          {label}
        </label>
      )}
      <input
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-err` : undefined}
        className={cn(
          "h-12 w-full rounded-2xl border bg-white px-4 text-[16px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-indigo-100 dark:bg-slate-900 dark:text-white",
          error ? "border-[#EF4444]" : "border-[#E2E8F0]",
          className
        )}
        {...props}
      />
      {error ? (
        <p id={`${fieldId}-err`} className="mt-1.5 flex items-center gap-1.5 text-sm text-[#EF4444]">
          <CircleAlert size={14} aria-hidden className="shrink-0" /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
