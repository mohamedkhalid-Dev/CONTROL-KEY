"use client";

import {
  BookOpen,
  Code2,
  Crosshair,
  GraduationCap,
  Languages,
  PenLine,
  Wrench,
} from "lucide-react";

/** Minimalist monochrome category icon — single neutral tone, no color fills. */
export function CategoryIcon({
  category,
  size = 14,
}: {
  category: string;
  size?: number;
}) {
  const cls = "text-slate-400";
  switch (category) {
    case "Homework":
      return <BookOpen size={size} aria-hidden className={cls} />;
    case "Exams":
      return <GraduationCap size={size} aria-hidden className={cls} />;
    case "Code":
      return <Code2 size={size} aria-hidden className={cls} />;
    case "Writing":
      return <PenLine size={size} aria-hidden className={cls} />;
    case "Language":
      return <Languages size={size} aria-hidden className={cls} />;
    case "Focus":
      return <Crosshair size={size} aria-hidden className={cls} />;
    default:
      return <Wrench size={size} aria-hidden className={cls} />;
  }
}
