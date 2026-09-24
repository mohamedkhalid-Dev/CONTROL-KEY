/**
 * Supabase sub-clients — one focused module per REQUIRED cloud data group.
 * Chat history is NOT here: it lives in browser localStorage ONLY
 * (ck_chats_v1 + ck_messages_v1, see hooks/useChats.ts).
 *
 * - profiles: name (display_name), age, email
 * - rules:    rule ON/OFF status (is_enabled)
 *
 * OpenRouter API key is NEVER here — localStorage `ck_openrouter_key` only.
 */
export { supabase } from "./client";
export * from "./types";
export * as profilesClient from "./profiles";
export * as rulesClient from "./rules";
