import { supabase } from "./client";
import type { Rule } from "@/lib/ruleGuard";

/**
 * rules sub-client — REQUIRED rule status only:
 * title, instruction, is_enabled (which locks are ON/OFF),
 * plus strength/priority needed to build the system prompt.
 * Every saved lock is custom (origin='custom').
 */

interface RuleDbRow {
  id: string;
  title?: string | null;
  instruction?: string | null;
  is_enabled?: boolean | null;
  strength?: string | null;
  category?: string | null;
  priority?: number | null;
  violation_count?: number | null;
  updated_at?: string | null;
}

function toRule(r: RuleDbRow, fallbackPriority: number): Rule {
  return {
    id: r.id,
    title: r.title ?? "Lock",
    instruction: r.instruction ?? "",
    is_enabled: r.is_enabled !== false,
    strength: r.strength === "strict" ? "strict" : "guide",
    category: (r.category as Rule["category"]) ?? "Custom",
    priority: typeof r.priority === "number" ? r.priority : fallbackPriority,
    violation_count: r.violation_count ?? 0,
    updatedAt: r.updated_at ?? new Date().toISOString(),
  };
}

export async function listRules(userId: string, limit = 50): Promise<Rule[]> {
  const { data, error } = await supabase
    .from("control_rules")
    .select("id,title,instruction,is_enabled,strength,category,priority,violation_count,updated_at")
    .eq("user_id", userId)
    .order("priority", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as RuleDbRow[]).map((r, i) => toRule(r, i + 1));
}

export async function upsertRule(userId: string, rule: Rule): Promise<void> {
  const { error } = await supabase.from("control_rules").upsert(
    {
      id: rule.id,
      user_id: userId,
      title: rule.title,
      instruction: rule.instruction,
      is_enabled: rule.is_enabled,
      strength: rule.strength,
      category: rule.category,
      priority: rule.priority,
      violation_count: rule.violation_count,
      origin: "custom",
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export async function deleteRule(id: string): Promise<void> {
  const { error } = await supabase.from("control_rules").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllRules(userId: string): Promise<void> {
  const { error } = await supabase.from("control_rules").delete().eq("user_id", userId);
  if (error) throw error;
}
