import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus-visible:ring-blue-200",
  secondary: "bg-[#F8FAFC] text-[#111827] border border-[#E2E8F0] hover:bg-[#EFF6FF]",
  ghost: "bg-transparent text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#111827]",
  danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
};

/** DRY primary button — 56px height, 16px radius, one primary per screen. */
export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50",
        size === "lg" && "h-14 px-8 text-base",
        size === "sm" && "min-h-[36px] px-3 text-xs",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
