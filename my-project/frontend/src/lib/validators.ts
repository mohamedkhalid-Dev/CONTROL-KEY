/**
 * Shared validators — single source of truth (mirrored by Laravel in backend).
 * All messages are kid-friendly (Grade 5-8) and shown inline, never alert().
 */

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

const ARABIC_LETTERS = "\\u0600-\\u06FF";

export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Tell us your name first." };
  if (trimmed.length < 2)
    return { ok: false, error: "Name needs 2 letters or more." };
  if (trimmed.length > 30)
    return { ok: false, error: "Shorten name to 30 letters max." };
  const allowed = new RegExp(`^[A-Za-z${ARABIC_LETTERS} ][A-Za-z${ARABIC_LETTERS} .'-]+$`);
  if (!allowed.test(trimmed))
    return { ok: false, error: "Use letters and spaces only." };
  if (/<|>|script|onerror/i.test(trimmed))
    return { ok: false, error: "That name has blocked symbols. Try another." };
  return { ok: true };
}

export function validateAge(age: unknown): ValidationResult {
  const n = typeof age === "string" ? Number(age) : (age as number);
  if (!Number.isFinite(n) || !Number.isInteger(n))
    return { ok: false, error: "Type your age as a whole number." };
  if (n < 1 || n > 120)
    return {
      ok: false,
      error: "Type an age between 1 and 120.",
    };
  return { ok: true };
}

export function validateApiKey(key: string): ValidationResult {
  const trimmed = key.trim();
  if (!trimmed)
    return {
      ok: false,
      error: "Oops! Paste your key first. Need one? Get it in 2 min.",
    };
  if (!trimmed.startsWith("sk-or-"))
    return {
      ok: false,
      error: "Hmm, keys start with sk-or-. Check for extra spaces.",
    };
  if (trimmed.length < 20)
    return { ok: false, error: "That key looks too short. Copy the full key." };
  if (/\s/.test(trimmed))
    return { ok: false, error: "Remove spaces inside the key." };
  return { ok: true };
}

export function validateRule(title: string, instruction: string): ValidationResult {
  const t = title.trim();
  const ins = instruction.trim();
  if (t.length < 3) return { ok: false, error: "Give your lock a title (3+ letters)." };
  if (t.length > 80) return { ok: false, error: "Keep title under 80 letters." };
  if (ins.length < 10)
    return { ok: false, error: "Explain the rule in 10+ letters so AI understands." };
  if (ins.length > 500)
    return { ok: false, error: "Keep rule under 500 letters. Short rules work best." };
  if (/<script|onerror|javascript:/i.test(t + ins))
    return { ok: false, error: "Blocked symbols removed. Use plain words." };
  return { ok: true };
}

/** Basic XSS sanitize for display — React escapes by default, this strips tags for extra safety. */
export function sanitizeText(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "Type your email first." };
  if (trimmed.length > 254) return { ok: false, error: "That email is too long." };
  // Simple, readable check — no scary regex in UI copy.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed))
    return { ok: false, error: "That email looks off. Check the spelling." };
  if (/<|>|script/i.test(trimmed))
    return { ok: false, error: "That email has blocked symbols." };
  return { ok: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return { ok: false, error: "Type a password first." };
  if (password.length < 6)
    return { ok: false, error: "Password needs 6+ letters. Make it a bit longer." };
  if (password.length > 128) return { ok: false, error: "Keep password under 128 letters." };
  return { ok: true };
}

export function validateConsent(accepted: boolean): ValidationResult {
  if (accepted) return { ok: true };
  return { ok: false, error: "Please tick the box to agree to the Terms + Privacy first." };
}
