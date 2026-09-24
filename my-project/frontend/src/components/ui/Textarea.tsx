import * as React from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxLength?: number;
}

export function Textarea({ label, error, maxLength, id, className, value, ...props }: TextareaProps) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  const len = String(value ?? props.defaultValue ?? "").length;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-bold text-slate-900 dark:text-white">
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        aria-invalid={!!error}
        className={cn(
          "min-h-[96px] w-full rounded-2xl border bg-white px-4 py-3 text-[16px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-indigo-100 dark:bg-slate-900 dark:text-white",
          error ? "border-[#EF4444]" : "border-[#E2E8F0]",
          className
        )}
        value={value}
        maxLength={maxLength}
        {...props}
      />
      <div className="mt-1 flex items-center justify-between">
        {error ? (
          <p className="flex items-center gap-1.5 text-sm text-[#EF4444]">
            <CircleAlert size={14} aria-hidden className="shrink-0" /> {error}
          </p>
        ) : (
          <span />
        )}
        {typeof maxLength === "number" && (
          <span className="text-xs text-slate-400">
            {len}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
