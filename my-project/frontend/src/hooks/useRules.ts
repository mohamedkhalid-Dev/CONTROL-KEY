"use client";

import * as React from "react";
import { rulesClient, supabase } from "@/lib/supabase";
import { profileStorage } from "@/lib/storage";
import { sanitizeText } from "@/lib/validators";
import type { Rule, RuleCategory, RuleStrength } from "@/lib/ruleGuard";
import { useAuth } from "@/lib/auth";

const LS_KEY = "ck_custom_locks";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `rule-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
function nowIso(): string {
  return new Date().toISOString();
}
function readLocal(): Rule[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((r) => r && r.title && r.instruction)
      .map((r, i) => ({
        id: String(r.id ?? uid()),
        title: String(r.title),
        instruction: String(r.instruction),
        is_enabled: r.is_enabled !== false,
        strength: r.strength === "strict" ? "strict" : "guide",
        category: (r.category as RuleCategory) ?? "Custom",
        priority: typeof r.priority === "number" ? r.priority : i + 1,
        violation_count: typeof r.violation_count === "number" ? r.violation_count : 0,
        updatedAt: r.updatedAt ?? nowIso(),
      }));
  } catch {
    return [];
  }
}
function writeLocal(rules: Rule[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(rules));
  } catch {
    /* private mode — ignore */
  }
}
/** Demo / logged-out sessions stay local-only (no Supabase writes). */
function isCloudId(uidVal: string | null): boolean {
  return !!uidVal && uidVal !== "demo-local";
}
function normalizeOrder(rules: Rule[]): Rule[] {
  return [...rules]
    .sort((a, b) => a.priority - b.priority)
    .map((r, i) => ({ ...r, priority: i + 1 }));
}

export interface NewRuleInput {
  title: string;
  instruction: string;
  strength: RuleStrength;
  category: RuleCategory;
}

/**
 * useRules — My Locks CRUD.
 * Local-first (works offline + demo via ck_custom_locks), Supabase best-effort
 * mirror with realtime refresh. Every saved lock is custom (origin='custom').
 */
export function useRules() {
  const { user: authUser } = useAuth();
  const authUserId = authUser?.id ?? null;
  const [rules, setRules] = React.useState<Rule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  // Initial load: local first (instant), then Supabase merge (logged in only)
  React.useEffect(() => {
    let cancelled = false;
    const local = readLocal();
    setRules(normalizeOrder(local));
    setLoading(false);

    async function cloudLoad() {
      const uidVal = authUserId;
      if (cancelled) return;
      setIsLoggedIn(!!uidVal);
      if (!isCloudId(uidVal)) return;
      // Heal legacy mismatch (random local id → real auth id)
      if (uidVal) {
        const lp = profileStorage.get();
        if (lp && lp.userId !== uidVal) {
          profileStorage.set({ ...lp, userId: uidVal });
        }
      }
      try {
        if (!uidVal) return;
        const cloud = await rulesClient.listRules(uidVal, 50);
        if (cancelled) return;
        // Merge: cloud wins for same id, local-only rows kept (offline drafts)
        setRules((prev) => {
          const cloudIds = new Set(cloud.map((c) => c.id));
          const localOnly = prev.filter((p) => !cloudIds.has(p.id));
          const merged = normalizeOrder([...cloud, ...localOnly]);
          writeLocal(merged);
          return merged;
        });
        if (!cancelled) setLoadError(null);
      } catch (e) {
        if (cancelled) return;
        const msg = (e as { message?: string })?.message ?? "";
        if (/row-level|policy|jwt|auth/i.test(msg)) {
          setLoadError("Log in to sync locks in the cloud. Saved on this device for now.");
        } else {
          setLoadError("Cloud sync paused — locks saved on this device.");
        }
      }
    }
    cloudLoad();

    // Realtime: refresh when locks change elsewhere (logged in only)
    let channel: { unsubscribe: () => void } | null = null;
    if (!cancelled && isCloudId(authUserId)) {
      try {
        const ch = supabase
          .channel("ck-rules")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "control_rules", filter: `user_id=eq.${authUserId}` },
            () => cloudLoad()
          )
          .subscribe();
        channel = { unsubscribe: () => supabase.removeChannel(ch) };
      } catch {
        /* realtime unavailable — focus refresh covers it */
      }
    }
    const onFocus = () => cloudLoad();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      channel?.unsubscribe();
    };
  }, [authUserId]);

  const persist = React.useCallback((next: Rule[]) => {
    const ordered = normalizeOrder(next);
    setRules(ordered);
    writeLocal(ordered);
  }, []);

  const cloudUpsert = React.useCallback((rule: Rule) => {
    if (!isCloudId(authUserId)) return;
    rulesClient.upsertRule(authUserId as string, rule).catch(() => {});
  }, [authUserId]);

  const cloudDelete = React.useCallback((id: string) => {
    if (!isCloudId(authUserId)) return;
    // Ownership enforced inside rulesClient.deleteRule (assertOwner + user_id scope).
    rulesClient.deleteRule(authUserId as string, id).catch(() => {});
  }, [authUserId]);

  const createRule = React.useCallback(
    (input: NewRuleInput): Rule => {
      const rule: Rule = {
        id: uid(),
        title: sanitizeText(input.title).slice(0, 80),
        instruction: sanitizeText(input.instruction).slice(0, 500),
        is_enabled: true,
        strength: input.strength,
        category: input.category,
        priority: rules.length + 1,
        violation_count: 0,
        updatedAt: nowIso(),
      };
      persist([...rules, rule]);
      cloudUpsert(rule);
      return rule;
    },
    [rules, persist, cloudUpsert]
  );

  const updateRule = React.useCallback(
    (id: string, patch: Partial<NewRuleInput>) => {
      const next = rules.map((r) =>
        r.id === id
          ? {
              ...r,
              title: patch.title !== undefined ? sanitizeText(patch.title).slice(0, 80) : r.title,
              instruction:
                patch.instruction !== undefined ? sanitizeText(patch.instruction).slice(0, 500) : r.instruction,
              strength: patch.strength ?? r.strength,
              category: patch.category ?? r.category,
              updatedAt: nowIso(),
            }
          : r
      );
      persist(next);
      const found = next.find((r) => r.id === id);
      if (found) cloudUpsert(found);
    },
    [rules, persist, cloudUpsert]
  );

  const toggleRule = React.useCallback(
    (id: string, on?: boolean) => {
      const next = rules.map((r) =>
        r.id === id ? { ...r, is_enabled: on !== undefined ? on : !r.is_enabled, updatedAt: nowIso() } : r
      );
      persist(next);
      const found = next.find((r) => r.id === id);
      if (found) cloudUpsert(found);
      return found ?? null;
    },
    [rules, persist, cloudUpsert]
  );

  const setAll = React.useCallback(
    (on: boolean) => {
      const next = rules.map((r) => ({ ...r, is_enabled: on, updatedAt: nowIso() }));
      persist(next);
      next.forEach(cloudUpsert);
    },
    [rules, persist, cloudUpsert]
  );

  const deleteRule = React.useCallback(
    (id: string) => {
      persist(rules.filter((r) => r.id !== id));
      cloudDelete(id);
    },
    [rules, persist, cloudDelete]
  );

  const moveRule = React.useCallback(
    (id: string, dir: -1 | 1) => {
      const ordered = normalizeOrder(rules);
      const idx = ordered.findIndex((r) => r.id === id);
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= ordered.length) return;
      const arr = [...ordered];
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      const renumbered = arr.map((r, i) => ({ ...r, priority: i + 1, updatedAt: nowIso() }));
      persist(renumbered);
      renumbered.forEach(cloudUpsert);
    },
    [rules, persist, cloudUpsert]
  );

  const incrementViolation = React.useCallback(
    (id: string) => {
      const next = rules.map((r) =>
        r.id === id ? { ...r, violation_count: r.violation_count + 1, updatedAt: nowIso() } : r
      );
      persist(next);
      const found = next.find((r) => r.id === id);
      if (found) cloudUpsert(found);
    },
    [rules, persist, cloudUpsert]
  );

  /** Drag-to-reorder: move dragged rule just before target (top = strongest). */
  const reorder = React.useCallback(
    (dragId: string, targetId: string) => {
      if (dragId === targetId) return;
      const ordered = normalizeOrder(rules);
      const from = ordered.findIndex((r) => r.id === dragId);
      const to = ordered.findIndex((r) => r.id === targetId);
      if (from < 0 || to < 0) return;
      const arr = [...ordered];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      const renumbered = arr.map((r, i) => ({ ...r, priority: i + 1, updatedAt: nowIso() }));
      persist(renumbered);
      renumbered.forEach(cloudUpsert);
    },
    [rules, persist, cloudUpsert]
  );

  const activeRules = React.useMemo(
    () => normalizeOrder(rules.filter((r) => r.is_enabled)),
    [rules]
  );
  const activeCount = activeRules.length;

  return {
    rules,
    activeRules,
    activeCount,
    total: rules.length,
    loading,
    loadError,
    isLoggedIn,
    createRule,
    updateRule,
    toggleRule,
    setAll,
    deleteRule,
    moveRule,
    reorder,
    incrementViolation,
  };
}
