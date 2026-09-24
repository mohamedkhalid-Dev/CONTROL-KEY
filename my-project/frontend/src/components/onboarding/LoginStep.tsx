"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { validateEmail, validatePassword, validateConsent } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";

/**
 * LoginStep — Step 1 of onboarding (email + password).
 * When already logged in, shows account + lets the user continue.
 */
export function LoginStep() {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [emailErr, setEmailErr] = useState<string | undefined>();
  const [pwErr, setPwErr] = useState<string | undefined>();
  const [consent, setConsent] = useState(false);
  const [consentErr, setConsentErr] = useState<string | undefined>();
  const [formErr, setFormErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <div className="text-center">
        <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500" aria-hidden>
          <CheckCircle2 size={28} strokeWidth={1.75} />
        </p>
        <h2 className="font-heading mt-4 text-2xl font-extrabold text-[#0F172A] dark:text-white">
          You&apos;re logged in.
        </h2>
        <p className="mx-auto mt-1 max-w-xs text-sm text-slate-600 dark:text-slate-300">
          {user.email ?? "Account ready."} Select Next to add your name.
        </p>
      </div>
    );
  }

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormErr(null);
    setDone(null);
    if (!validateAll()) return;
    setBusy(true);
    const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result.error) {
      setFormErr(result.error);
      return;
    }
    if (mode === "signup") {
      setDone("Account created. Check your inbox to confirm, then log in.");
    }
    // On sign-in the session updates via onAuthStateChange and the
    // logged-in state above takes over — Next unlocks automatically.
  }

  return (
    <div>
      <h2 className="font-heading text-center text-2xl font-extrabold text-[#0F172A] dark:text-white">
        Log in to start — it&apos;s free.
      </h2>
      <p className="mx-auto mt-1 max-w-xs text-center text-sm text-slate-600 dark:text-slate-300">
        No card. Your key stays yours.
      </p>

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

      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
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
            placeholder="6+ characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (pwErr) setPwErr(undefined);
            }}
            error={pwErr}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-pressed={showPw}
            className="mt-1 min-h-[36px] text-xs font-bold text-[#4F46E5] underline"
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>

        {formErr && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {formErr}
          </p>
        )}
        {done && (
          <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {done}
          </p>
        )}

        {mode === "signup" ? (
          <Checkbox
            id="consent-onboarding"
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

        <Button type="submit" size="lg" className="w-full" disabled={busy || (mode === "signup" && !consent)}>
          {busy ? "Checking…" : mode === "signin" ? "Log in" : "Create my account"}
        </Button>
      </form>
    </div>
  );
}
