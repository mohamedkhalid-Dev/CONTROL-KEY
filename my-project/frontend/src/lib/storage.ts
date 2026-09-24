/**
 * Safe localStorage wrappers for Control Key.
 * All keys prefixed with ck_. Never throws — returns fallback on SSR / private mode.
 */

const isBrowser = () => typeof window !== "undefined";

function safeGet(key: string): string | null {
  try {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (!isBrowser()) return;
    window.localStorage.setItem(key, value);
  } catch {
    // private mode full — ignore, app still works in-memory
  }
}

function safeRemove(key: string): void {
  try {
    if (!isBrowser()) return;
    window.localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

function safeGetJson<T>(key: string, fallback: T): T {
  try {
    const raw = safeGet(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSetJson(key: string, value: unknown): void {
  try {
    safeSet(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

export interface StoredProfile {
  userId: string;
  displayName: string;
  age: number;
  avatarColor: string;
  /** Convenience mirror of auth email — auth stays source of truth. */
  email?: string | null;
}

// --- OpenRouter key (SECRET — browser localStorage ONLY, never Supabase) ---
// Security rule (migration 0006): key_vault table was dropped. Do NOT POST
// this key to /vault/store, Supabase, or any backend. Device-only by design.
export const storageKeys = {
  openrouterKey: "ck_openrouter_key",
  sidebarOpen: "ck_sidebar_open",
  theme: "ck_theme",
  profile: "ck_profile",
  onboardingDraft: "ck_onboarding_draft",
  lastModel: "ck_last_model",
  fontSize: "ck_font_size",
  reduceMotion: "ck_reduce_motion",
} as const;

export type FontSize = "s" | "m" | "l";

export const keyStorage = {
  get: () => {
    const v = safeGet(storageKeys.openrouterKey);
    return v ? v.trim() : null;
  },
  set: (key: string) => safeSet(storageKeys.openrouterKey, key.trim()),
  remove: () => safeRemove(storageKeys.openrouterKey),
  /** Masked for display / logs — never expose full key. */
  mask: (key: string | null) => {
    if (!key || key.length < 8) return "••••";
    return `sk-or-...****${key.slice(-4)}`;
  },
};

export const sidebarStorage = {
  get: (defaultOpen: boolean): boolean => {
    const raw = safeGet(storageKeys.sidebarOpen);
    if (raw === null) return defaultOpen;
    return raw === "true";
  },
  set: (open: boolean) => safeSet(storageKeys.sidebarOpen, String(open)),
};

export const profileStorage = {
  get: (): StoredProfile | null =>
    safeGetJson<StoredProfile | null>(storageKeys.profile, null),
  set: (p: StoredProfile) => safeSetJson(storageKeys.profile, p),
  remove: () => safeRemove(storageKeys.profile),
};

export const draftStorage = {
  get: <T>(fallback: T): T =>
    safeGetJson<T>(storageKeys.onboardingDraft, fallback),
  set: (v: unknown) => safeSetJson(storageKeys.onboardingDraft, v),
  remove: () => safeRemove(storageKeys.onboardingDraft),
};

export const modelStorage = {
  get: (fallback: string): string => {
    const v = safeGet(storageKeys.lastModel);
    return v ?? fallback;
  },
  set: (model: string) => safeSet(storageKeys.lastModel, model),
};

/** Font size S/M/L — applied to <html data-font> by PreferencesInit. */
export const fontStorage = {
  get: (): FontSize => {
    const v = safeGet(storageKeys.fontSize);
    return v === "s" || v === "l" ? v : "m";
  },
  set: (s: FontSize) => safeSet(storageKeys.fontSize, s),
};

/** Reduce motion — kills animations for sensitive users. */
export const motionStorage = {
  get: (): boolean => safeGet(storageKeys.reduceMotion) === "true",
  set: (on: boolean) => safeSet(storageKeys.reduceMotion, String(on)),
};
