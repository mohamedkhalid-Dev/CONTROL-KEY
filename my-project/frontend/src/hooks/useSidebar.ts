"use client";
import * as React from "react";
import { sidebarStorage } from "@/lib/storage";

/**
 * Sidebar open/close state — persisted, responsive default.
 * Required close element: chevron + X + Ctrl/Cmd+B + Esc + backdrop.
 */
export function useSidebar() {
  const [open, setOpen] = React.useState<boolean>(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const defaultOpen = window.innerWidth >= 1024;
    setOpen(sidebarStorage.get(defaultOpen));
    setMounted(true);
  }, []);

  const setAndPersist = React.useCallback((next: boolean | ((p: boolean) => boolean)) => {
    setOpen((prev) => {
      const v = typeof next === "function" ? (next as (p: boolean) => boolean)(prev) : next;
      sidebarStorage.set(v);
      return v;
    });
  }, []);

  // Keyboard: Ctrl/Cmd+B toggles, Esc closes (mobile drawer)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setAndPersist((p) => !p);
      }
      if (e.key === "Escape") setAndPersist(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setAndPersist]);

  // Auto-collapse when resizing to mobile
  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) setAndPersist(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setAndPersist]);

  return { open, setOpen: setAndPersist, mounted };
}
