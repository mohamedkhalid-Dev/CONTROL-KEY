/**
 * Shared shapes for the MINIMAL Supabase store
 * (migrations 0006_minimal_store + 0007_local_chat_history).
 *
 * Stored in Supabase:
 * - profiles:      display_name (name), age, email
 * - control_rules: title, instruction, is_enabled (ON/OFF status)
 *
 * Stored in browser localStorage ONLY (never Supabase):
 * - chat history (ck_chats_v1 + ck_messages_v1, incl. per-session model + config)
 * - OpenRouter API key (sk-or-...) — `ck_openrouter_key` ONLY.
 */

export interface ModelConfig {
  temperature: number;
  max_tokens: number;
}

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  temperature: 0.7,
  max_tokens: 800,
};

/** Strict Exam mode uses steadier quizzes (see chat/page.tsx §10). */
export const EXAM_MODEL_CONFIG: ModelConfig = {
  temperature: 0.3,
  max_tokens: 800,
};

export function normalizeModelConfig(raw: unknown): ModelConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_MODEL_CONFIG };
  const r = raw as Partial<ModelConfig>;
  const temperature =
    typeof r.temperature === "number" && Number.isFinite(r.temperature)
      ? Math.min(2, Math.max(0, r.temperature))
      : DEFAULT_MODEL_CONFIG.temperature;
  const max_tokens =
    typeof r.max_tokens === "number" && Number.isInteger(r.max_tokens)
      ? Math.min(4000, Math.max(1, r.max_tokens))
      : DEFAULT_MODEL_CONFIG.max_tokens;
  return { temperature, max_tokens };
}
