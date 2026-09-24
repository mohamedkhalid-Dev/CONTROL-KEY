import { reportError } from "@/lib/report";

/**
 * securityMonitor.ts — tiny client-side guard used by monitor sub-agents.
 * Reuses report.ts (anonymous {id, route, code} only). No PII, no keys.
 */

// Open-redirect guard: the single fix LoginForm + onboarding deep-links need.
export function safeNextPath(raw: string | null, fallback = "/onboarding"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes(":") || raw.includes("\\")) return fallback;
  return raw;
}

// Defense-in-depth for markdown links (rehype-sanitize runs first).
export function safeHref(href: string | undefined): string | null {
  if (!href) return null;
  return /^https?:\/\//i.test(href) ? href : null;
}

// Best-effort alert to primary agent pipeline via existing /api/log channel.
export async function alertPrimary(code: string): Promise<void> {
  try {
    const { genErrorId } = await import("@/lib/report");
    await reportError(genErrorId(), code.slice(0, 20));
  } catch {
    /* never blocks UI */
  }
}
