"use client";

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { SITE_URL } from "@/lib/seo";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<AuthActionResult>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  updatePassword: (newPassword: string) => Promise<AuthActionResult>;
}

export interface AuthActionResult {
  error: string | null;
  /** Seconds to wait before retrying after an Auth 429. */
  retryAfterSeconds?: number;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function isLegacyAnonymousUser(user: User | null): boolean {
  return (user as (User & { is_anonymous?: boolean }) | null)?.is_anonymous === true;
}

/** Friendly Supabase error → plain language, no jargon.
 * Sign-in failures are generic ("Invalid credentials" equivalent) so an
 * attacker cannot enumerate registered emails. Signup "already registered"
 * is likewise normalized — do NOT confirm account existence. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid email or password"))
    return "Invalid credentials. Check spelling or create an account.";
  if (m.includes("user already registered") || m.includes("already exists"))
    return "Something went wrong. Try logging in instead.";
  if (m.includes("email not confirmed") || m.includes("confirm"))
    return "Check your inbox — select the confirm link, then log in.";
  if (m.includes("password should be"))
    return "Password needs 8+ characters. Make it a bit longer.";
  if (m.includes("invalid email"))
    return "That email looks off. Check the spelling.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Login is taking a short breather. Please wait for the countdown, then try once.";
  if (m.includes("network") || m.includes("fetch"))
    return "No connection. Check your network and retry.";
  return "Something went wrong. Try again.";
}

/**
 * Supabase does not always expose Retry-After through supabase-js, but its
 * Auth error text can include the server's exact wait. Keep a short fallback
 * so a generic 429 cannot be retried in a tight loop.
 */
export function authRetryAfterSeconds(message: string): number | undefined {
  const match = message.match(/(?:after|wait|retry(?: in)?)[^\d]*(\d+)\s*(second|seconds|s|minute|minutes|m)?/i);
  if (!match) return undefined;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  const unit = (match[2] ?? "s").toLowerCase();
  return Math.min(unit.startsWith("m") ? amount * 60 : amount, 3600);
}

function isRateLimited(error: unknown, message: string): boolean {
  const status = (error as { status?: number } | null)?.status;
  const normalized = message.toLowerCase();
  return status === 429 || normalized.includes("rate limit") || normalized.includes("too many");
}

function authErrorResult(error: unknown): AuthActionResult {
  const message = (error as { message?: string } | null)?.message ?? "auth failed";
  return {
    error: friendlyAuthError(message),
    retryAfterSeconds: isRateLimited(error, message) ? authRetryAfterSeconds(message) ?? 30 : undefined,
  };
}

/**
 * Canonical site base for auth email links.
 * Uses NEXT_PUBLIC_SITE_URL via SITE_URL, falls back to production.
 * Must be allowlisted in Supabase Dashboard > Auth > URL Configuration.
 */
function siteBase(): string {
  const v = (SITE_URL ?? "").replace(/\/$/, "");
  return v || "https://controlkey.vercel.app";
}

/**
 * AuthProvider — single source of truth for login state.
 * Wraps the whole app in layout.tsx. Persists session via Supabase
 * (localStorage `sb-*-auth-token`, never our own key copy).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (isLegacyAnonymousUser(data.session?.user ?? null)) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
      } else {
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      }
    } catch {
      /* offline — keep last state */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (isLegacyAnonymousUser(next?.user ?? null)) {
        void supabase.auth.signOut();
        setSession(null);
        setUser(null);
        return;
      }
      setSession(next ?? null);
      setUser(next?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const signUp = React.useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          // Verification emails land on controlkey.vercel.app, then forward to /login?verified=1.
          // The /auth/callback route exchanges the PKCE ?code= before redirecting.
          emailRedirectTo: `${siteBase()}/auth/callback?next=/login%3Fverified%3D1`,
        },
      });
      if (error) return authErrorResult(error);
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      return { error: null };
    } catch (e) {
      return authErrorResult(e);
    }
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) return authErrorResult(error);
      setSession(data.session ?? null);
      setUser(data.user ?? data.session?.user ?? null);
      return { error: null };
    } catch (e) {
      return authErrorResult(e);
    }
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    setUser(null);
    setSession(null);
    try {
      // Clear app-local caches so next login starts fresh.
      // NOTE: we keep OpenRouter key? No — full logout clears it too
      // would strand chats. Keep key (device-owned), clear profile only.
      localStorage.removeItem("ck_profile");
      localStorage.removeItem("ck_onboarding_draft");
      localStorage.removeItem("ck_tour_done");
    } catch {
      /* private mode */
    }
  }, []);

  /**
   * requestPasswordReset — sends a recovery email via Supabase Auth.
   * The link contains a cryptographically random, single-use token that
   * expires (default <=1h, configured in Supabase Dashboard > Auth).
   * Never log the token; it arrives only via the user's inbox.
   * Response is generic so it cannot be used to enumerate accounts.
   */
  const requestPasswordReset = React.useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${siteBase()}/auth/callback?next=/login` },
      );
      if (error) return authErrorResult(error);
      // Generic success even if email is unknown (no enumeration).
      return { error: null };
    } catch (e) {
      return authErrorResult(e);
    }
  }, []);

  /** updatePassword — sets a new password for a recovery/authenticated session. */
  const updatePassword = React.useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return authErrorResult(error);
      return { error: null };
    } catch (e) {
      return authErrorResult(e);
    }
  }, []);

  const value = React.useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refresh,
    requestPasswordReset,
    updatePassword,
  }), [user, session, loading, signUp, signIn, signOut, refresh, requestPasswordReset, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** useAuth — read login state anywhere (client components only). */
export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider> (see layout.tsx)");
  return ctx;
}

/**
 * getAuthUserId — for non-React helpers / hooks that can't use context.
 * Returns the Supabase auth user id (== profiles.user_id == RLS auth.uid()),
 * or the legacy local profile id for demo/offline fallback.
 */
export async function getAuthUserId(fallbackLocalId?: string | null): Promise<string | null> {
  try {
    // Client-side code already has the signed-in session. getUser() performs
    // a network request; getSession() reads local auth state and lets the
    // database/RLS validate the token when the actual query is made.
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user?.id) return data.session.user.id;
  } catch {
    /* offline */
  }
  return fallbackLocalId ?? null;
}

/* ------------------------------------------------------------------ */
/* 2FA via Supabase MFA (TOTP). Opt-in plan:                           */
/*  1. enrollTotp() → show qr_code / secret to user (authenticator app) */
/*  2. verifyTotpEnrollment(factorId, code) → completes enrollment      */
/*  3. On sign-in with AAL1 session, challengeTotp(factorId) then      */
/*     verifyTotpChallenge(factorId, challengeId, code) → AAL2 session  */
/* Passwords stay bcrypt-hashed server-side; TOTP secrets never leave  */
/* Supabase Auth and are never logged. See Supabase Dashboard > Auth >  */
/* MFA to enable TOTP.                                                  */
/* ------------------------------------------------------------------ */

export async function listMfaFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return { error: friendlyAuthError(error.message), factors: [] as unknown[] };
  return { error: null, factors: data?.totp ?? [] };
}

export async function enrollTotp(friendlyName = "authenticator") {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName });
  if (error) return { error: friendlyAuthError(error.message), data: null };
  // data: { id, totp: { qr_code, secret, uri } } — render qr_code, never log secret.
  return { error: null, data };
}

export async function verifyTotpEnrollment(factorId: string, code: string) {
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return authErrorResult(error);
  return { error: null, data };
}

export async function challengeTotp(factorId: string) {
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  if (error) return { error: friendlyAuthError(error.message), challengeId: null };
  return { error: null, challengeId: data?.id ?? null };
}

export async function verifyTotpChallenge(factorId: string, challengeId: string, code: string) {
  const { data, error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
  if (error) return authErrorResult(error);
  return { error: null, data };
}
