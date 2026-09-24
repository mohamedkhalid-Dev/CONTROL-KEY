"use client";

import * as React from "react";
import { fontStorage, motionStorage } from "@/lib/storage";

/**
 * PreferencesInit — applies saved font size + reduce-motion before first
 * paint-ish (runs on mount, no FOUC for theme which is handled in <head>).
 */
export function PreferencesInit() {
  React.useEffect(() => {
    try {
      document.documentElement.dataset.font = fontStorage.get();
      document.documentElement.classList.toggle("reduce-motion", motionStorage.get());
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}

export function applyFontSize(s: "s" | "m" | "l"): void {
  fontStorage.set(s);
  try {
    document.documentElement.dataset.font = s;
  } catch {
    /* ignore */
  }
}

export function applyReduceMotion(on: boolean): void {
  motionStorage.set(on);
  try {
    document.documentElement.classList.toggle("reduce-motion", on);
  } catch {
    /* ignore */
  }
}
