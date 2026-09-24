"use client";

import * as React from "react";

const COLORS = ["#2563EB", "#16A34A", "#EA580C", "#7C3AED", "#64748B", "#111827"];
const PIECES = 42;

/**
 * ConfettiBurst — welcome confetti, zero deps, CSS-only.
 * Respects reduce-motion (renders nothing) and unmounts after the fall.
 */
export function ConfettiBurst({ onDone }: { onDone?: () => void }) {
  const [gone, setGone] = React.useState(false);
  const pieces = React.useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        left: (i * 97) % 100,
        delay: ((i * 37) % 500) / 1000,
        color: COLORS[i % COLORS.length],
        round: i % 3 === 0,
        size: 6 + ((i * 13) % 7),
      })),
    []
  );

  React.useEffect(() => {
    try {
      if (
        document.documentElement.classList.contains("reduce-motion") ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setGone(true);
        onDone?.();
        return;
      }
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => {
      setGone(true);
      onDone?.();
    }, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  if (gone) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-64 overflow-hidden">
      <style>{`@keyframes ck-fall{to{transform:translateY(16rem) rotate(540deg);opacity:0}}`}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: -12,
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            background: p.color,
            borderRadius: p.round ? "50%" : 2,
            animation: `ck-fall 2s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
