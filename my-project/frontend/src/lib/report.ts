/**
 * report.ts — friendly error IDs + anonymous reporting (Error Matrix #20).
 * Every crash shows an ID like CK-8F3K2; reporting sends ONLY {id, route,
 * code} to Laravel POST /api/log. Never PII, never keys, never chat text.
 */

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000/api";

export function genErrorId(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  const bytes = new Uint8Array(5);
  try {
    crypto.getRandomValues(bytes);
    for (let i = 0; i < bytes.length; i++) s += chars[bytes[i] % chars.length];
  } catch {
    for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CK-${s}`;
}

/** Best-effort report — never throws, never blocks UI. */
export async function reportError(id: string, code?: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${BACKEND}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        route: typeof window !== "undefined" ? window.location.pathname.slice(0, 200) : "ssr",
        code: code?.slice(0, 20) ?? "unknown",
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}
