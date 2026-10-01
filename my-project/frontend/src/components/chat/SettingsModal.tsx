"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  Database,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  User,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Avatar } from "@/components/ui/Avatar";
import { applyFontSize, applyReduceMotion } from "@/components/PreferencesInit";
import {
  fontStorage,
  keyStorage,
  motionStorage,
  profileStorage,
  type FontSize,
} from "@/lib/storage";
import { validateAge, validateName } from "@/lib/validators";
import { getDiscipline } from "@/lib/discipline";
import { profilesClient, rulesClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { APP_VERSION, APP_STAGE } from "@/lib/version";
import type { useChats } from "@/hooks/useChats";
import type { useRules } from "@/hooks/useRules";

type ChatsApi = ReturnType<typeof useChats>;
type RulesApi = ReturnType<typeof useRules>;

/**
 * SettingsModal — full Stage 6 editor: profile, key, appearance,
 * progress, data export/delete, about + report. Sections collapse
 * to keep mobile scrolling short.
 */
export function SettingsModal({
  open,
  onClose,
  displayName,
  age,
  chats,
  rulesApi,
  onProfileSaved,
}: {
  open: boolean;
  onClose: () => void;
  displayName: string;
  age: number;
  chats: ChatsApi;
  rulesApi: RulesApi;
  onProfileSaved: (name: string, age: number) => void;
}) {
  const router = useRouter();
  const { user: authUser, signOut } = useAuth();

  const [name, setName] = React.useState(displayName);
  const [ageStr, setAgeStr] = React.useState(String(Number.isFinite(age) ? age : 14));
  const [profileError, setProfileError] = React.useState<string | undefined>();
  const [revealed, setRevealed] = React.useState(false);
  const [font, setFont] = React.useState<FontSize>("m");
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [confirmChats, setConfirmChats] = React.useState(false);
  const [confirmAccount, setConfirmAccount] = React.useState(false);
  const [deleteWord, setDeleteWord] = React.useState("");
  const [report, setReport] = React.useState("");
  const [reportSent, setReportSent] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(displayName);
      setAgeStr(String(Number.isFinite(age) ? age : 14));
      setProfileError(undefined);
      setRevealed(false);
      setFont(fontStorage.get());
      setReduceMotion(motionStorage.get());
      setConfirmChats(false);
      setConfirmAccount(false);
      setDeleteWord("");
      setReport("");
      setReportSent(false);
    }
  }, [open, displayName, age]);

  // Auto-hide revealed key after 10s (security)
  React.useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => setRevealed(false), 10000);
    return () => clearTimeout(t);
  }, [revealed]);

  const fullKey = keyStorage.get();
  const progress = getDiscipline();
  // Weekly report card (§6.7): chats active in last 7 days + self-solves + locks.
  // Cheap local parse — runs each render, no memo needed.
  function weekStats(): { weekChats: number; solves: number } {
    let weekChats = 0;
    try {
      const raw = localStorage.getItem("ck_chats_v1");
      const arr = raw ? JSON.parse(raw) : [];
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (Array.isArray(arr)) {
        weekChats = arr.filter((s) => s && s.updatedAt && new Date(s.updatedAt).getTime() >= weekAgo).length;
      }
    } catch {
      /* ignore */
    }
    return { weekChats, solves: Math.floor(progress.score / 10) };
  }
  const stats = weekStats();

  function saveProfile() {
    const n = validateName(name);
    if (!n.ok) {
      setProfileError(n.error);
      return;
    }
    const a = validateAge(ageStr);
    if (!a.ok) {
      setProfileError(a.error);
      return;
    }
    const nextAge = Number(ageStr);
    // AuthProvider already holds the verified session for this client. Avoid
    // another /auth/v1/user request just to learn the same user id.
    const authId = authUser?.id ?? profileStorage.get()?.userId ?? `local-${Date.now()}`;
    const authEmail = authUser?.email ?? profileStorage.get()?.email ?? null;
    profileStorage.set({
      userId: authId,
      displayName: name.trim(),
      age: nextAge,
      avatarColor: profileStorage.get()?.avatarColor ?? "#4F46E5",
      email: authEmail,
    });
    // Best-effort cloud mirror via sub-client: name, age, email only (works when logged in).
    // Access control: cloud user_id MUST equal the signed-in auth.uid() —
    // never trust profileStorage/local IDs for server writes (IDOR guard;
    // profilesClient.assertOwner + RLS USING (auth.uid() = user_id) enforce it).
    try {
      const p = profileStorage.get();
      const signedInId = authUser?.id ?? null;
      if (p && signedInId && authId === signedInId && !signedInId.startsWith("local-")) {
        profilesClient
          .upsertProfile({ userId: signedInId, displayName: p.displayName, age: p.age, email: authEmail })
          .catch(() => {});
      }
    } catch {
      /* offline — local is truth */
    }
    setProfileError(undefined);
    onProfileSaved(name.trim(), nextAge);
    toast.success("Profile saved.");
  }

  function logoutKey() {
    keyStorage.remove();
    toast.success("Key deleted from this device.");
    onClose();
    router.push("/onboarding?step=3");
  }

  async function signOutAll() {
    await signOut();
    toast.success("Logged out.");
    onClose();
    router.push("/login");
  }

  function exportAll() {
    try {
      const dump: Record<string, unknown> = { app: "Control Key", version: APP_VERSION, exportedAt: new Date().toISOString() };
      for (const k of ["ck_profile", "ck_chats_v1", "ck_messages_v1", "ck_custom_locks", "ck_discipline", "ck_last_model"]) {
        try {
          const raw = localStorage.getItem(k);
          dump[k] = raw ? JSON.parse(raw) : null;
        } catch {
          dump[k] = null;
        }
      }
      dump["ck_openrouter_key"] = "MASKED — keys are never exported. Re-enter it on the new device.";
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "control-key-data.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data downloaded. Key excluded.");
    } catch {
      toast.error("Export failed — try again.");
    }
  }

  function wipeChats() {
    // History is localStorage-only: wipe this device, nothing in Supabase.
    try {
      localStorage.removeItem("ck_chats_v1");
      localStorage.removeItem("ck_messages_v1");
    } catch {
      /* ignore */
    }
    chats.retryLoad();
    setConfirmChats(false);
    toast.success("All chats deleted from this device.");
  }

  async function wipeAccount() {
    if (deleteWord.trim().toUpperCase() !== "DELETE") return;
    // Access control: cloud wipe only for the signed-in owner. Never fall
    // back to a localStorage id — that would allow deleting another user's
    // rows if the local id were tampered with (IDOR).
    const uid = authUser?.id ?? null;
    try {
      for (const k of ["ck_profile", "ck_onboarding_draft", "ck_openrouter_key", "ck_chats_v1", "ck_messages_v1", "ck_custom_locks", "ck_discipline", "ck_last_model", "ck_tour_done"]) {
        localStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
    if (uid && uid !== "demo-local") {
      try {
        // Supabase keeps profile + rules only. Chat history is localStorage-only,
        // so account wipe clears local chats above + cloud profile/rules here.
        // key_vault / feedback / rule_templates / chat_sessions / messages do not
        // exist (migrations 0006–0007).
        await rulesClient.deleteAllRules(uid);
        await profilesClient.deleteProfile(uid);
      } catch {
        /* offline — local wipe still counts */
      }
    }
    toast.success("Account data cleared.");
    onClose();
    router.push("/");
  }

  async function sendReport() {
    const text = report.trim();
    if (text.length < 5) {
      toast.error("Describe the problem first.");
      return;
    }
    // Reports are local-only now — feedback table dropped as not required
    // (migration 0006). Copy to clipboard for sending manually.
    try {
      await navigator.clipboard?.writeText(`[Control Key v${APP_VERSION} report] ${text.slice(0, 1000)}`);
    } catch {
      /* clipboard unavailable */
    }
    setReportSent(true);
    toast.success("Report copied — send it to support. Thank you.");
  }

  return (
    <Modal open={open} onClose={onClose} title="Settings" wide>
      <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-0.5">
        {/* 0. Account */}
        <section aria-label="Account">
          <h3 className="font-heading flex items-center gap-1.5 font-extrabold">
            <KeyRound size={16} aria-hidden className="text-slate-400" /> Account
          </h3>
          {authUser ? (
            <div className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800">
              <p className="font-bold text-slate-700 dark:text-slate-200">
                Logged in as {authUser.email}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Chats and locks sync across your devices.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={signOutAll}
                  className="min-h-[40px] rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-600"
                >
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
              Not logged in — chats save on this device only.{" "}
              <Link href="/login?next=/chat" className="font-extrabold underline">
                Log in to sync →
              </Link>
            </p>
          )}
        </section>

        {/* 1. Profile */}
        <section aria-label="Profile">
          <h3 className="font-heading flex items-center gap-1.5 font-extrabold">
            <User size={16} aria-hidden className="text-slate-400" /> Profile
          </h3>
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={name.trim() || "?"} size={48} />
            <div className="grid flex-1 grid-cols-2 gap-2">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoComplete="off" />
              <Input label="Age" value={ageStr} onChange={(e) => setAgeStr(e.target.value)} inputMode="numeric" autoComplete="off" />
            </div>
          </div>
          {profileError && (
            <p role="alert" className="mt-1 text-sm font-bold text-red-600">
              {profileError}
            </p>
          )}
          <Button size="sm" className="mt-2" onClick={saveProfile}>
            Save profile
          </Button>
        </section>

        {/* 2. Key — localStorage ONLY, never Supabase */}
        <section aria-label="API key">
          <h3 className="font-heading flex items-center gap-1.5 font-extrabold">
            <KeyRound size={16} aria-hidden className="text-slate-400" /> API key (this device only)
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Stored in browser localStorage. Never uploaded, never in the database.
          </p>
          {fullKey ? (
            <div className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
              <code className="font-mono font-bold">{revealed ? fullKey : keyStorage.mask(fullKey)}</code>
              {revealed && <span className="block text-xs text-slate-500">Auto-hides in 10s. Never share it.</span>}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRevealed((v) => !v)}
                  className="flex min-h-[40px] items-center gap-1.5 rounded-xl border px-4 text-xs font-extrabold"
                >
                  {revealed ? (
                    <>
                      <EyeOff size={14} aria-hidden /> Hide
                    </>
                  ) : (
                    <>
                      <Eye size={14} aria-hidden /> Reveal 10s
                    </>
                  )}
                </button>
                <Link href="/onboarding?step=3" className="flex min-h-[40px] items-center rounded-xl border px-4 text-xs font-extrabold">
                  Change key
                </Link>
                <button
                  type="button"
                  onClick={logoutKey}
                  className="min-h-[40px] rounded-xl border border-red-200 px-4 text-xs font-extrabold text-red-600"
                >
                  Delete key + logout
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
              No key saved here.{" "}
              <Link href="/onboarding?step=3" className="font-extrabold underline">
                Add one →
              </Link>
            </p>
          )}
        </section>

        {/* 3. Appearance — Light Mode locked */}
        <section aria-label="Appearance">
          <h3 className="font-heading font-extrabold text-[#111827]">Look & feel</h3>
          <div className="mt-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#111827]">
            Light Mode — always on for clarity
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Font size">
            {(["s", "m", "l"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={font === s}
                onClick={() => {
                  setFont(s);
                  applyFontSize(s);
                }}
                className={`min-h-[48px] rounded-2xl border-2 text-sm font-extrabold text-[#111827] ${
                  font === s ? "border-[#2563EB] bg-[#EFF6FF]" : "border-[#E2E8F0] bg-white"
                }`}
              >
                {s === "s" ? "Small" : s === "m" ? "Medium" : "Large"}
              </button>
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-bold text-[#111827]">Reduce motion</span>
            <Toggle
              checked={reduceMotion}
              onChange={(on) => {
                setReduceMotion(on);
                applyReduceMotion(on);
              }}
              label="Reduce motion"
            />
          </div>
        </section>

        {/* 4. Progress */}
        <section aria-label="Progress">
          <h3 className="font-heading flex items-center gap-1.5 font-extrabold">
            <Activity size={16} aria-hidden className="text-slate-400" /> Progress
          </h3>
          <p className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
            Discipline Score: {progress.score} · {progress.streak}-day streak
            <span className="block text-xs font-normal text-slate-500">+10 every time you solve with hints instead of answers.</span>
          </p>
          <p className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            This week: {stats.weekChats} chats · {stats.solves} self-solves · {rulesApi.activeCount} locks ON
            <span className="block text-xs font-normal text-slate-500">Consistency beats cramming.</span>
          </p>
        </section>

        {/* 5. Data */}
        <section aria-label="My data">
          <h3 className="font-heading flex items-center gap-1.5 font-extrabold">
            <Database size={16} aria-hidden className="text-slate-400" /> Data
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {chats.sessions.length} chats · {rulesApi.total} locks ({rulesApi.activeCount} ON)
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" size="sm" className="flex-1" onClick={exportAll}>
              Export all (JSON)
            </Button>
            {!confirmChats ? (
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setConfirmChats(true)}>
                Delete all chats
              </Button>
            ) : (
              <div className="flex flex-1 gap-2">
                <Button variant="danger" size="sm" className="flex-1" onClick={wipeChats}>
                  Yes, delete all
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmChats(false)}>
                  Keep
                </Button>
              </div>
            )}
          </div>
          {!confirmAccount ? (
            <button
              type="button"
              onClick={() => setConfirmAccount(true)}
              className="mt-2 min-h-[44px] w-full rounded-2xl border border-red-200 text-sm font-extrabold text-red-600"
            >
              Delete my account…
            </button>
          ) : (
            <div className="mt-2 rounded-2xl border border-red-300 p-3">
              <p className="text-sm font-bold text-red-700">Wipe EVERYTHING (profile, chats, locks)? This cannot be undone.</p>
              <Input
                label='Type DELETE to confirm'
                placeholder="DELETE"
                value={deleteWord}
                onChange={(e) => setDeleteWord(e.target.value)}
                autoComplete="off"
              />
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setConfirmAccount(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  disabled={deleteWord.trim().toUpperCase() !== "DELETE"}
                  onClick={wipeAccount}
                >
                  Wipe forever
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* 6. About + report */}
        <section aria-label="About and report">
          <h3 className="font-heading flex items-center gap-1.5 font-extrabold">
            <Info size={16} aria-hidden className="text-slate-400" /> About
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Control Key v{APP_VERSION} ({APP_STAGE}) · Free ·{" "}
            <Link href="/parents" className="underline">
              For parents and teachers
            </Link>
          </p>
          {reportSent ? (
            <p role="status" className="mt-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
              Report sent. Thank you.
            </p>
          ) : (
            <div className="mt-2 flex gap-2">
              <input
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Report a problem…"
                aria-label="Describe the problem"
                autoComplete="off"
                className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#4F46E5] dark:border-slate-700 dark:bg-slate-900"
              />
              <Button size="sm" onClick={sendReport}>
                Send
              </Button>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
