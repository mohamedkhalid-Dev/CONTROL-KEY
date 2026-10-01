"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { safeNextPath } from "@/lib/securityMonitor";
import { profileStorage } from "@/lib/storage";
import { profilesClient } from "@/lib/supabase";
import { validateEmail, validatePassword, validateConsent } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";

const AUTH_COOLDOWN_KEY = "ck_auth_cooldown_until";

function readAuthCooldown(): number | null {
  try {
    const until = Number(sessionStorage.getItem(AUTH_COOLDOWN_KEY));
    const remaining = Math.ceil((until - Date.now()) / 1000);
    return remaining > 0 ? remaining : null;
  } catch {
    return null;
  }
}

function saveAuthCooldown(seconds: number): void {
  try {
    sessionStorage.setItem(AUTH_COOLDOWN_KEY, String(Date.now() + seconds * 1000));
  } catch {
    /* private mode */
  }
}

function clearAuthCooldown(): void {
  try {
    sessionStorage.removeItem(AUTH_COOLDOWN_KEY);
  } catch {
    /* private mode */
  }
}

/**
 * LoginForm — the ONE login method for Control Key.
 * Email + password (Supabase Auth).
 * Single focal CTA, inline errors only.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Open-redirect guard: only same-origin paths (see securityMonitor.safeNextPath).
  const next = safeNextPath(params.get("next"));
  const verified = params.get("verified") === "1";
  const authError = params.get("error");
  const { user, loading, signIn, signUp, requestPasswordReset } = useAuth();

  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [emailErr, setEmailErr] = React.useState<string | undefined>();
  const [pwErr, setPwErr] = React.useState<string | undefined>();
  const [consent, setConsent] = React.useState(false);
  const [consentErr, setConsentErr] = React.useState<string | undefined>();
  const [formErr, setFormErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<"email" | null>(null);
  const [done, setDone] = React.useState<string | null>(null);
  const [retryIn, setRetryIn] = React.useState<number | null>(readAuthCooldown);
  const [resetSent, setResetSent] = React.useState(false);

  React.useEffect(() => {
    if (retryIn === null) return;
    if (retryIn <= 0) {
      setRetryIn(null);
      clearAuthCooldown();
      return;
    }
    const timer = window.setTimeout(() => setRetryIn((value) => (value === null ? null : value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [retryIn]);

  // Already logged in → go where they wanted.
  // Returning users with a saved cloud profile skip name/age entirely.
  React.useEffect(() => {
    if (loading || !user) return;
    const uid = user.id;
    const uemail = user.email ?? null;
    let cancelled = false;
    async function resolve() {
      // Explicit ?next= (e.g. /chat) is respected; bare /login defaults
      // to the Control Room when a profile already exists.
      const rawNext = params.get("next");
      if (rawNext) {
        if (!cancelled) router.replace(next);
        return;
      }
      try {
        const existing = await profilesClient.getProfile(uid);
        if (cancelled) return;
        if (existing?.display_name) {
          profileStorage.set({
            userId: existing.user_id,
            displayName: existing.display_name,
            age: existing.age ?? 14,
            avatarColor: profileStorage.get()?.avatarColor ?? "#4F46E5",
            email: existing.email ?? uemail,
          });
          router.replace("/chat");
          return;
        }
      } catch {
        /* offline / RLS — fall through to default */
      }
      if (!cancelled) router.replace(next);
    }
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [loading, user, router, next, params]);

  function validateAll(): boolean {
    const e = validateEmail(email);
    const p = validatePassword(password);
    setEmailErr(e.ok ? undefined : e.error);
    setPwErr(p.ok ? undefined : p.error);
    if (mode === "signup") {
      const c = validateConsent(consent);
      setConsentErr(c.ok ? undefined : c.error);
      return e.ok && p.ok && c.ok;
    }
    setConsentErr(undefined);
    return e.ok && p.ok;
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (busy !== null || retryIn !== null) return;
    setFormErr(null);
    setDone(null);
    if (!validateAll()) return;
    setBusy("email");
    const fn = mode === "signin" ? signIn : signUp;
    const result = await fn(email, password);
    setBusy(null);
    if (result.error) {
      if (result.retryAfterSeconds) {
        setRetryIn(result.retryAfterSeconds);
        saveAuthCooldown(result.retryAfterSeconds);
      }
      setFormErr(result.error);
      return;
    }
    clearAuthCooldown();
    setRetryIn(null);
    if (mode === "signup") {
      setDone("Account created. Check your inbox to confirm, then log in.");
      return;
    }
    // Sign-in success: returning users already have a cloud profile
    // (name + age) → heal local cache and go straight to /chat.
    // No re-asking name/age. New users (no profile) → onboarding.
    try {
      const { data } = await (await import("@/lib/supabaseClient")).supabase.auth.getUser();
      const uid = data?.user?.id;
      if (uid) {
        const existing = await profilesClient.getProfile(uid);
        if (existing?.display_name) {
          profileStorage.set({
            userId: existing.user_id,
            displayName: existing.display_name,
            age: existing.age ?? 14,
            avatarColor: profileStorage.get()?.avatarColor ?? "#4F46E5",
            email: existing.email ?? data.user?.email ?? null,
          });
          router.replace(params.get("next") ? next : "/chat");
          return;
        }
      }
    } catch {
      /* offline — fall through to default */
    }
    router.replace(next);
  }

  async function forgotPassword() {
    setFormErr(null);
    const e = validateEmail(email);
    setEmailErr(e.ok ? undefined : e.error);
    if (!e.ok) return;
    const result = await requestPasswordReset(email);
    if (result.error) {
      setFormErr(result.error);
      return;
    }
    // Generic confirmation — never reveals whether the email exists.
    // Supabase recovery tokens are cryptographically random, single-use, expire <=1h.
    setResetSent(true);
    setDone("If that email has an account, a reset link is on its way (expires in 1 hour, single-use).");
  }

  return (
    <div className="ck-card w-full max-w-md p-6 sm:p-8">
      {/* Focal point: tiny key + headline (Option A purity) */}
      <div className="flex flex-col items-center text-center">
        <Image
          src="/key-illustration.svg"
          alt="Golden key — your login unlocks cloud sync"
          width={96}
          height={96}
          className="h-20 w-20"
          priority
        />
        <h1 className="font-heading mt-3 text-2xl font-extrabold text-[#0F172A] dark:text-white">
          {mode === "signin" ? "Welcome back." : "Create your account."}
        </h1>
        <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Log in to save chats + locks in the cloud. Same account on phone + laptop.
        </p>
      </div>

      {/* Mode tabs — rhythm: same pill style everywhere */}
      <div
        role="tablist"
        aria-label="Log in or create account"
        className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800"
      >
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            type="button"
            onClick={() => {
              setMode(m);
              setFormErr(null);
              setDone(null);
              setResetSent(false);
              setConsent(false);
              setConsentErr(undefined);
            }}
            className={`min-h-[44px] rounded-xl text-sm font-extrabold transition ${
              mode === m
                ? "bg-white text-[#4F46E5] shadow dark:bg-slate-900"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {m === "signin" ? "Log in" : "New account"}
          </button>
        ))}
      </div>

      <form onSubmit={submitEmail} className="mt-5 space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailErr) setEmailErr(undefined);
          }}
          error={emailErr}
        />
        <div>
          <Input
            label="Password"
            type={showPw ? "text" : "password"}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="8+ characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (pwErr) setPwErr(undefined);
            }}
            error={pwErr}
          />
          <div className="mt-1 flex min-h-[36px] items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-pressed={showPw}
              className="flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] underline"
            >
              {showPw ? (
                <>
                  <EyeOff size={14} aria-hidden /> Hide
                </>
              ) : (
                <>
                  <Eye size={14} aria-hidden /> Show
                </>
              )}
            </button>
            {mode === "signin" && !resetSent && (
              <button
                type="button"
                onClick={forgotPassword}
                className="text-xs font-bold text-[#4F46E5] underline"
              >
                Forgot password?
              </button>
            )}
          </div>
        </div>

        {formErr && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {formErr}
            {retryIn !== null && <span className="mt-1 block text-xs font-semibold">Try again in {retryIn}s.</span>}
          </p>
        )}
        {verified && !formErr && !done && (
          <p role="status" className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            Email confirmed — log in.
          </p>
        )}
        {authError && !formErr && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            Confirm link expired. Create your account again to resend it.
          </p>
        )}
        {done && (
          <p role="status" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
            {done}
          </p>
        )}

        {mode === "signup" ? (
          <Checkbox
            id="consent-signup"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (consentErr) setConsentErr(undefined);
            }}
            error={consentErr}
            label={
              <>
                By creating an account, you agree to our{" "}
                <Link
                  href="/terms"
                  className="font-bold text-[#4F46E5] underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-bold text-[#4F46E5] underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>
                .
              </>
            }
          />
        ) : (
          <p className="text-center text-xs leading-relaxed text-slate-500">
            By logging in, you agree to our{" "}
            <Link href="/terms" className="font-bold text-[#4F46E5] underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-bold text-[#4F46E5] underline">
              Privacy Policy
            </Link>
            .
          </p>
        )}

        {/* ONE primary CTA per screen (contrast rule) */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={busy !== null || retryIn !== null || (mode === "signup" && !consent)}
        >
          {busy === "email"
            ? "Checking…"
            : retryIn !== null
              ? `Try again in ${retryIn}s…`
            : mode === "signin"
              ? "Log in →"
              : "Create account"}
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-between text-xs">
        <Link href="/" className="font-bold text-slate-500 underline">
          ← Back home
        </Link>
        <span className="flex items-center gap-3">
          <Link href="/terms" className="font-bold text-slate-500 underline">
            Terms
          </Link>
          <Link href="/privacy" className="font-bold text-slate-500 underline">
            How we keep you safe
          </Link>
        </span>
      </div>
    </div>
  );
}
