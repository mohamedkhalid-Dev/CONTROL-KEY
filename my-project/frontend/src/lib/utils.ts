import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely — single source for conditional styling. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
