"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Stepper } from "@/components/onboarding/Stepper";
import { LoginStep } from "@/components/onboarding/LoginStep";
import { NameStep } from "@/components/onboarding/NameStep";
import { AgeStep } from "@/components/onboarding/AgeStep";
import { KeyStep, type KeyState } from "@/components/onboarding/KeyStep";
import { Button } from "@/components/ui/Button";
import { avatarColorFor } from "@/components/ui/Avatar";
import {
  sanitizeText,
  validateAge,
  validateApiKey,
  validateName,
} from "@/lib/validators";
import { draftStorage, keyStorage, profileStorage } from "@/lib/storage";
import { profilesClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

interface Draft {
  name: string;
  age: number;
  // No `key` field: the OpenRouter secret lives ONLY in ck_openrouter_key
  // (see storage.ts). A previous version persisted it here too — legacy
  // drafts may still contain `key`, which is ignored on load below.
  key?: string;
}

const DEFAULT_DRAFT: Draft = { name: "", age: 14, key: "" };

/** 4-step wizard: Login → Name → Age → Key. State lives in ?step= + localStorage draft. */
export function OnboardingWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const stepFromUrl = Math.min(4, Math.max(1, Number(params.get("step") ?? 1) || 1));

  const [step, setStep] = useState(stepFromUrl);
  const [name, setName] = useState(DEFAULT_DRAFT.name);
  const [age, setAge] = useState(DEFAULT_DRAFT.age);
  const [keyState, setKeyState] = useState<KeyState>({
    key: "",
    show: false,
    testing: false,
    testedOk: false,
    testMsg: null,
    guideOpen: false,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [returningChecked, setReturningChecked] = useState(false);

  // Load draft once (name/age only — legacy draft.key is never restored)
  useEffect(() => {
    const d = draftStorage.get<Draft>(DEFAULT_DRAFT);
    setName(d.name ?? "");
    setAge(typeof d.age === "number" ? d.age : 14);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft: name/age only. The API key stays in component state until
  // finish() moves it to keyStorage — never in the draft, never in Supabase.
  useEffect(() => {
    draftStorage.set({ name, age });
  }, [name, age]);

  // Keep URL in sync
  useEffect(() => {
    router.replace(`/onboarding?step=${step}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Step 1 (Login) is public — everything after requires an account.
  // If a logged-out visitor deep-links to ?step=2/3/4, bounce them to step 1.
  useEffect(() => {
    if (!authLoading && !user && step > 1) {
      setStep(1);
    }
  }, [authLoading, user, step]);

  // Returning user? Cloud profile already has name + age → heal local
  // cache and skip straight to /chat. Never re-ask name/age.
  useEffect(() => {
    if (authLoading || !user || returningChecked) return;
    const uid = user.id;
    const uemail = user.email ?? null;
    let cancelled = false;
    async function checkReturning() {
      try {
        const existing = await profilesClient.getProfile(uid);
        if (cancelled) return;
        if (existing?.display_name) {
          profileStorage.set({
            userId: existing.user_id,
            displayName: existing.display_name,
            age: existing.age ?? 14,
            avatarColor: avatarColorFor(existing.display_name),
            email: existing.email ?? uemail,
          });
          draftStorage.remove();
          router.replace("/chat");
          return;
        }
      } catch {
        /* offline / RLS — stay in wizard, new-user flow */
      } finally {
        if (!cancelled) setReturningChecked(true);
      }
    }
    void checkReturning();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, returningChecked, router]);

  const canNext = useMemo(() => {
    if (step === 1) return !!user;
    if (step === 2) return validateName(name).ok;
    if (step === 3) return validateAge(age).ok;
    return false; // step 4 uses Enter button, not Next
  }, [step, user, name, age]);

  async function finish() {
    const cleanName = sanitizeText(name);
    const vKey = validateApiKey(keyState.key);
    if (!validateName(cleanName).ok || !validateAge(age).ok || !vKey.ok) {
      setSaveError("Check the red notes above, then try again.");
      return;
    }
    setSaving(true);
    setSaveError(null);

    // Step 1 (Login) completes auth inside the wizard, so RLS can safely use
    // the authenticated Supabase user id for every cloud write.
    const authId = user?.id ?? null;
    if (!authId) {
      setSaving(false);
      setSaveError("Please log in before completing setup.");
      return;
    }

    const profile = {
      userId: authId,
      displayName: cleanName,
      age,
      avatarColor: avatarColorFor(cleanName),
      email: user?.email ?? null,
    };

    // 1) Local first — app works offline even if Supabase is down.
    // OpenRouter key: localStorage ONLY, never Supabase (see storage.ts).
    keyStorage.set(keyState.key.trim());
    profileStorage.set(profile);

    // 2) Cloud profile via sub-client — name, age, email only.
    // user_id == auth.uid() so RLS passes.
    try {
      await profilesClient.upsertProfile({
        userId: authId,
        displayName: cleanName,
        age,
        email: user?.email ?? null,
        avatarColor: profile.avatarColor,
      });
    } catch (e) {
      // RLS / offline — local still works, but tell the truth
      const msg = (e as { message?: string })?.message ?? "";
      if (/row-level|rls|policy|auth|jwt/i.test(msg)) {
        setSaving(false);
        setSaveError(
          "Cloud save was blocked. Please log in again, then retry. Your key is safe on this device."
        );
        return;
      }
      // offline — continue, local is truth
    }

    draftStorage.remove();
    router.push("/chat?welcome=1");
  }

  if (authLoading || (user && !returningChecked)) {
    return <main className="ck-container flex min-h-screen items-center justify-center py-10 text-center">{user ? "Welcome back… opening your saved setup…" : "Opening secure setup…"}</main>;
  }

  return (
    <main className="ck-container flex min-h-screen flex-col items-center py-10">
      <Link href="/" className="text-sm font-bold text-[#4F46E5]">
        ← Back home
      </Link>
      <h1 className="font-heading mt-4 text-3xl font-extrabold text-[#0F172A] dark:text-white">
        Get your Control Room
      </h1>
      <div className="mt-6 w-full max-w-xl">
        <Stepper step={step} />
      </div>

      <div className="ck-card mt-8 w-full max-w-xl p-6 sm:p-8">
        {step === 1 && <LoginStep />}
        {step === 2 && <NameStep name={name} setName={setName} />}
        {step === 3 && <AgeStep age={age} setAge={setAge} />}
        {step === 4 && <KeyStep state={keyState} setState={setKeyState} />}

        {saveError && (
          <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {saveError}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            disabled={step === 1 || saving}
            onClick={() => setStep(Math.max(1, step - 1))}
          >
            ← Back
          </Button>
          {step < 4 ? (
            <Button disabled={!canNext} onClick={() => setStep(step + 1)} size="lg">
              Next →
            </Button>
          ) : (
            <Button disabled={saving || !keyState.key.trim()} onClick={finish} size="lg">
              {saving ? "Opening…" : "Enter My Control Room →"}
            </Button>
          )}
        </div>
      </div>

    </main>
  );
}
